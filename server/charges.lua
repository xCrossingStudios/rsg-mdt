local RSGCore = exports['rsg-core']:GetCoreObject()

local ChargesDatabaseReady = false

local function initializeChargesDatabase()
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS mdt_charge_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            fine INT DEFAULT 0,
            jailtime INT DEFAULT 0,
            category VARCHAR(50) DEFAULT 'misdemeanor',
            created_by VARCHAR(50),
            created_by_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_name (name)
        )
    ]])

    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS mdt_issued_charges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            citizenid VARCHAR(50) NOT NULL,
            citizen_name VARCHAR(100) NOT NULL,
            charge_template_id INT,
            charge_name VARCHAR(255) NOT NULL,
            charge_description TEXT,
            fine INT DEFAULT 0,
            jailtime INT DEFAULT 0,
            officer VARCHAR(100) NOT NULL,
            officer_cid VARCHAR(50),
            report_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_citizenid (citizenid),
            INDEX idx_officer (officer),
            FOREIGN KEY (charge_template_id) REFERENCES mdt_charge_templates(id) ON DELETE SET NULL
        )
    ]])

    local existingTemplates = MySQL.query.await("SELECT COUNT(*) as count FROM mdt_charge_templates")
    if existingTemplates and existingTemplates[1] and existingTemplates[1].count == 0 then
        local defaultCharges = {
            { 'Assault', 'Physical assault on another person', 50, 2, 'felony' },
            { 'Battery', 'Unlawful physical force against another', 75, 3, 'felony' },
            { 'Theft', 'Stealing property valued under $50', 25, 0, 'misdemeanor' },
            { 'Grand Theft', 'Stealing property valued $50 or more', 100, 6, 'felony' },
            { 'Trespassing', 'Unauthorized entry onto private property', 15, 0, 'misdemeanor' },
            { 'Public Intoxication', 'Being drunk in public', 10, 0, 'infraction' },
            { 'Disorderly Conduct', 'Disturbing the peace', 20, 0, 'misdemeanor' },
            { 'Vandalism', 'Willful destruction of property', 30, 0, 'misdemeanor' },
            { 'Fraud', 'Deception for personal gain', 150, 12, 'felony' },
            { 'Murder', 'Unlawful killing of another person', 0, 60, 'felony' },
            { 'Horse Theft', 'Stealing a horse or other mount', 200, 24, 'felony' },
            { 'Bank Robbery', 'Robbery of a banking institution', 500, 48, 'felony' },
            { 'Resisting Arrest', 'Resisting or fleeing from law enforcement', 50, 1, 'misdemeanor' },
            { 'Obstruction of Justice', 'Interfering with law enforcement duties', 40, 0, 'misdemeanor' },
        }
        
        for _, charge in ipairs(defaultCharges) do
            MySQL.insert.await(
                "INSERT INTO mdt_charge_templates (name, description, fine, jailtime, category) VALUES (?, ?, ?, ?, ?)",
                charge
            )
        end
    end

    ChargesDatabaseReady = true
end

CreateThread(function()
    Wait(1500)
    initializeChargesDatabase()
end)

local function waitForChargesDatabase()
    local timeout = 5000
    local waited = 0
    while not ChargesDatabaseReady and waited < timeout do
        Wait(100)
        waited = waited + 100
    end
    return ChargesDatabaseReady
end

local function hasAdminPermission(source)
    local player = RSGCore.Functions.GetPlayer(source)
    if not player then return false end
    
    local job = player.PlayerData.job
    if not job then return false end
    
    local jobConfig = Config.LawJobs[job.name]
    if not jobConfig then return false end
    
    local gradeConfig = jobConfig.grades[job.grade.level]
    if not gradeConfig then return false end
    
    return gradeConfig.isAdmin == true
end

local function hasCreateRecordsPermission(source)
    local player = RSGCore.Functions.GetPlayer(source)
    if not player then return false end
    
    local job = player.PlayerData.job
    if not job then return false end
    
    local jobConfig = Config.LawJobs[job.name]
    if not jobConfig then return false end
    
    local gradeConfig = jobConfig.grades[job.grade.level]
    if not gradeConfig then return false end
    
    return gradeConfig.canCreateRecords == true
end

local function logChargeAction(source, action, targetType, targetId, targetName, details)
    local player = RSGCore.Functions.GetPlayer(source)
    if not player then return end
    
    local performerName = player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname
    local performerCid = player.PlayerData.citizenid
    
    MySQL.insert.await(
        "INSERT INTO mdt_audit_logs (action, target_type, target_id, target_name, details, performed_by, performed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
        { action, targetType, targetId, targetName, details and json.encode(details) or nil, performerCid, performerName }
    )
end

local function getAdmins()
    local admins = {}
    local players = RSGCore.Functions.GetPlayers()
    for _, playerId in ipairs(players) do
        local src = tonumber(playerId)
        if hasAdminPermission(src) then
            table.insert(admins, src)
        end
    end
    return admins
end

local function broadcastToAdmins(event, data)
    local admins = getAdmins()
    for _, adminId in ipairs(admins) do
        TriggerClientEvent(event, adminId, data)
    end
end

local function getLawOfficers()
    local officers = {}
    local players = RSGCore.Functions.GetPlayers()
    for _, playerId in ipairs(players) do
        local src = tonumber(playerId)
        local player = RSGCore.Functions.GetPlayer(src)
        if player and player.PlayerData.job then
            local jobName = player.PlayerData.job.name
            if Config.LawJobs[jobName] then
                table.insert(officers, src)
            end
        end
    end
    return officers
end

local function broadcastToOfficers(event, data)
    local officers = getLawOfficers()
    for _, officerId in ipairs(officers) do
        TriggerClientEvent(event, officerId, data)
    end
end

lib.callback.register('rsg-mdt:server:getChargeTemplates', function(source)
    if not waitForChargesDatabase() then return {} end
    
    local templates = MySQL.query.await(
        "SELECT * FROM mdt_charge_templates ORDER BY category, name"
    )
    
    return templates or {}
end)

lib.callback.register('rsg-mdt:server:addChargeTemplate', function(source, data)
    if not hasAdminPermission(source) then
        return { success = false, message = 'Only administrators can create charge templates' }
    end
    if not waitForChargesDatabase() then
        return { success = false, message = 'Database not ready' }
    end
    
    local name = data.name
    local description = data.description or ''
    local fine = tonumber(data.fine) or 0
    local jailtime = tonumber(data.jailtime) or 0
    local category = data.category or 'misdemeanor'
    
    if not name or #name < 2 then
        return { success = false, message = 'Charge name is required (min 2 characters)' }
    end
    
    local existing = MySQL.query.await("SELECT id FROM mdt_charge_templates WHERE name = ?", { name })
    if existing and existing[1] then
        return { success = false, message = 'A charge template with this name already exists' }
    end
    
    local player = RSGCore.Functions.GetPlayer(source)
    local createdBy = player and player.PlayerData.citizenid or nil
    local createdByName = player and (player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname) or 'System'
    
    local insertId = MySQL.insert.await(
        "INSERT INTO mdt_charge_templates (name, description, fine, jailtime, category, created_by, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
        { name, description, fine, jailtime, category, createdBy, createdByName }
    )
    
    if insertId then
        logChargeAction(source, 'charge_template_created', 'charge_template', tostring(insertId), name, {
            name = name,
            fine = fine,
            jailtime = jailtime,
            category = category
        })
        
        broadcastToAdmins('rsg-mdt:client:chargesUpdated', { action = 'created', id = insertId, name = name })
        
        return { success = true, id = insertId }
    end
    
    return { success = false, message = 'Failed to create charge template' }
end)

lib.callback.register('rsg-mdt:server:updateChargeTemplate', function(source, data)
    if not hasAdminPermission(source) then
        return { success = false, message = 'Only administrators can update charge templates' }
    end
    if not waitForChargesDatabase() then
        return { success = false, message = 'Database not ready' }
    end
    
    local id = tonumber(data.id)
    local name = data.name
    local description = data.description
    local fine = tonumber(data.fine)
    local jailtime = tonumber(data.jailtime)
    local category = data.category
    
    if not id then
        return { success = false, message = 'Charge template ID is required' }
    end
    
    local existing = MySQL.query.await("SELECT name FROM mdt_charge_templates WHERE id = ?", { id })
    if not existing or not existing[1] then
        return { success = false, message = 'Charge template not found' }
    end
    
    local oldName = existing[1].name
    
    local affected = MySQL.update.await(
        "UPDATE mdt_charge_templates SET name = ?, description = ?, fine = ?, jailtime = ?, category = ? WHERE id = ?",
        { name, description, fine, jailtime, category, id }
    )
    
    if affected then
        logChargeAction(source, 'charge_template_updated', 'charge_template', tostring(id), oldName, {
            oldName = oldName,
            newName = name,
            fine = fine,
            jailtime = jailtime,
            category = category
        })
        
        broadcastToAdmins('rsg-mdt:client:chargesUpdated', { action = 'updated', id = id, name = name })
        
        return { success = true }
    end
    
    return { success = false, message = 'Failed to update charge template' }
end)

lib.callback.register('rsg-mdt:server:deleteChargeTemplate', function(source, id)
    if not hasAdminPermission(source) then
        return { success = false, message = 'Only administrators can delete charge templates' }
    end
    if not waitForChargesDatabase() then
        return { success = false, message = 'Database not ready' }
    end
    
    id = tonumber(id)
    if not id then
        return { success = false, message = 'Charge template ID is required' }
    end
    
    local template = MySQL.query.await("SELECT name FROM mdt_charge_templates WHERE id = ?", { id })
    if not template or not template[1] then
        return { success = false, message = 'Charge template not found' }
    end
    
    local templateName = template[1].name
    
    local affected = MySQL.update.await("DELETE FROM mdt_charge_templates WHERE id = ?", { id })
    
    if affected and affected > 0 then
        logChargeAction(source, 'charge_template_deleted', 'charge_template', tostring(id), templateName)
        
        broadcastToAdmins('rsg-mdt:client:chargesUpdated', { action = 'deleted', id = id, name = templateName })
        
        return { success = true }
    end
    
    return { success = false, message = 'Failed to delete charge template' }
end)

lib.callback.register('rsg-mdt:server:issueCharges', function(source, data)
    if not hasCreateRecordsPermission(source) then
        return { success = false, message = 'You do not have permission to issue charges' }
    end
    if not waitForChargesDatabase() then
        return { success = false, message = 'Database not ready' }
    end
    
    local citizenid = data.citizenid
    local charges = data.charges
    local reportId = data.reportId
    
    if not citizenid or not charges or #charges == 0 then
        return { success = false, message = 'Citizen ID and at least one charge are required' }
    end
    
    local targetPlayer = RSGCore.Functions.GetPlayerByCitizenId(citizenid)
    local citizenName
    
    if targetPlayer then
        citizenName = targetPlayer.PlayerData.charinfo.firstname .. ' ' .. targetPlayer.PlayerData.charinfo.lastname
    else
        local result = MySQL.query.await("SELECT charinfo FROM players WHERE citizenid = ?", { citizenid })
        if result and result[1] then
            local charinfo = json.decode(result[1].charinfo)
            citizenName = charinfo.firstname .. ' ' .. charinfo.lastname
        else
            return { success = false, message = 'Citizen not found' }
        end
    end
    
    local player = RSGCore.Functions.GetPlayer(source)
    if not player then
        return { success = false, message = 'Officer not found' }
    end
    
    local officerName = player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname
    local officerCid = player.PlayerData.citizenid
    
    local totalFine = 0
    local totalJailtime = 0
    local issuedCharges = {}
    
    for _, charge in ipairs(charges) do
        local templateId = tonumber(charge.templateId)
        local chargeName = charge.name
        local chargeDescription = charge.description
        local fine = tonumber(charge.fine) or 0
        local jailtime = tonumber(charge.jailtime) or 0
        
        local insertId = MySQL.insert.await(
            "INSERT INTO mdt_issued_charges (citizenid, citizen_name, charge_template_id, charge_name, charge_description, fine, jailtime, officer, officer_cid, report_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            { citizenid, citizenName, templateId, chargeName, chargeDescription, fine, jailtime, officerName, officerCid, reportId }
        )
        
        if insertId then
            totalFine = totalFine + fine
            totalJailtime = totalJailtime + jailtime
            table.insert(issuedCharges, {
                id = insertId,
                name = chargeName,
                fine = fine,
                jailtime = jailtime
            })
        end
    end
    
        if #issuedCharges > 0 then
            local chargeIds = {}
            for _, issued in ipairs(issuedCharges) do
                table.insert(chargeIds, issued.id)
            end
            
            if totalFine > 0 then
                exports['rsg-mdt']:createOrUpdateFine(citizenid, citizenName, chargeIds, totalFine, officerName, officerCid)
            end
        
        logChargeAction(source, 'charges_issued', 'citizen', citizenid, citizenName, {
            charges = issuedCharges,
            totalFine = totalFine,
            totalJailtime = totalJailtime,
            reportId = reportId
        })
        
        if targetPlayer then
            local targetSource = targetPlayer.PlayerData.source
            TriggerClientEvent('rsg-mdt:client:notify', targetSource, {
                type = 'warning',
                message = #issuedCharges .. ' charge(s) issued. Fine: $' .. totalFine .. ', Jail: ' .. totalJailtime .. ' months'
            })
        end
        
        broadcastToOfficers('rsg-mdt:client:chargesUpdated', { 
            action = 'issued', 
            citizenid = citizenid, 
            citizenName = citizenName,
            count = #issuedCharges 
        })
        
        return {
            success = true,
            message = #issuedCharges .. ' charge(s) issued to ' .. citizenName,
            issuedCharges = issuedCharges,
            totalFine = totalFine,
            totalJailtime = totalJailtime
        }
    end
    
    return { success = false, message = 'Failed to issue charges' }
end)

lib.callback.register('rsg-mdt:server:getIssuedCharges', function(source, citizenid)
    if not waitForChargesDatabase() then return {} end
    
    if not citizenid then return {} end
    
    local charges = MySQL.query.await(
        "SELECT * FROM mdt_issued_charges WHERE citizenid = ? ORDER BY created_at DESC",
        { citizenid }
    )
    
    local finesResult = MySQL.query.await(
        "SELECT id, issued_charge_ids, due_date, status, paid_at FROM mdt_fines WHERE citizenid = ?",
        { citizenid }
    )
    
    local chargeIdToFine = {}
    for _, fine in ipairs(finesResult or {}) do
        if fine.issued_charge_ids and type(fine.issued_charge_ids) == 'string' then
            local chargeIds = json.decode(fine.issued_charge_ids)
            for _, chargeId in ipairs(chargeIds or {}) do
                chargeIdToFine[chargeId] = {
                    fine_id = fine.id,
                    due_date = fine.due_date,
                    fine_status = fine.status,
                    paid_at = fine.paid_at
                }
            end
        end
    end
    
    for _, charge in ipairs(charges or {}) do
        local fineInfo = chargeIdToFine[charge.id]
        if fineInfo then
            charge.fine_id = fineInfo.fine_id
            charge.due_date = fineInfo.due_date
            charge.fine_status = fineInfo.fine_status
            charge.paid_at = fineInfo.paid_at
        else
            charge.fine_id = nil
            charge.due_date = nil
            charge.fine_status = charge.fine and charge.fine > 0 and 'unpaid' or nil
            charge.paid_at = nil
        end
    end
    
    return charges or {}
end)

exports('getChargeTemplates', function()
    if not waitForChargesDatabase() then return {} end
    return MySQL.query.await("SELECT * FROM mdt_charge_templates ORDER BY category, name") or {}
end)

lib.callback.register('rsg-mdt:server:getAllIssuedCharges', function(source, searchQuery)
    if not waitForChargesDatabase() then return {} end
    
    if not hasCreateRecordsPermission(source) then
        return {}
    end
    
    local query
    local params = {}
    
    if searchQuery and #searchQuery > 0 then
        query = [[
            SELECT ic.*, 
                   CASE 
                       WHEN ic.charge_template_id IS NOT NULL THEN 
                           (SELECT category FROM mdt_charge_templates WHERE id = ic.charge_template_id)
                       ELSE 'misdemeanor'
                   END as category
            FROM mdt_issued_charges ic
            WHERE ic.citizenid LIKE ? 
               OR ic.citizen_name LIKE ? 
               OR ic.charge_name LIKE ? 
               OR ic.officer LIKE ?
               OR ic.id = ?
            ORDER BY ic.created_at DESC
            LIMIT 500
        ]]
        local searchPattern = '%' .. searchQuery .. '%'
        local searchId = tonumber(searchQuery) or 0
        params = { searchPattern, searchPattern, searchPattern, searchPattern, searchId }
    else
        query = [[
            SELECT ic.*,
                   CASE 
                       WHEN ic.charge_template_id IS NOT NULL THEN 
                           (SELECT category FROM mdt_charge_templates WHERE id = ic.charge_template_id)
                       ELSE 'misdemeanor'
                   END as category
            FROM mdt_issued_charges ic
            ORDER BY ic.created_at DESC
            LIMIT 500
        ]]
    end
    
    local charges = MySQL.query.await(query, params)
    return charges or {}
end)

lib.callback.register('rsg-mdt:server:getChargeDetails', function(source, chargeId)
    if not waitForChargesDatabase() then return nil end
    
    if not hasCreateRecordsPermission(source) then
        return nil
    end
    
    chargeId = tonumber(chargeId)
    if not chargeId then return nil end
    
    local charge = MySQL.query.await([[
        SELECT ic.*, ct.category
        FROM mdt_issued_charges ic
        LEFT JOIN mdt_charge_templates ct ON ic.charge_template_id = ct.id
        WHERE ic.id = ?
    ]], { chargeId })
    
    if charge and charge[1] then
        return charge[1]
    end
    
    return nil
end)
