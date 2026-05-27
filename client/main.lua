local RSGCore = exports['rsg-core']:GetCoreObject()
local isOpen = false

-- ============================================
-- Client Access State
-- ============================================
local playerAccess = {
    hasAccess = false,
    permissions = nil,
    jobLabel = nil
}

-- ============================================
-- Client API Functions
-- ============================================
local function HasMDTAccess()
    return playerAccess.hasAccess
end

local function GetMDTPermissions()
    return playerAccess.permissions
end

local function HasMDTPermission(permission)
    if not playerAccess.permissions then return false end
    return playerAccess.permissions[permission] == true
end

local function GetMDTJobLabel()
    return playerAccess.jobLabel
end

local function RefreshMDTAccess()
    TriggerServerEvent('rsg-mdt:server:checkAccess')
end

-- ============================================
-- Client Exports
-- ============================================
exports('hasAccess', HasMDTAccess)
exports('getPermissions', GetMDTPermissions)
exports('hasPermission', HasMDTPermission)
exports('getJobLabel', GetMDTJobLabel)
exports('refreshAccess', RefreshMDTAccess)

-- ============================================
-- Client Events (Server Responses)
-- ============================================
RegisterNetEvent('rsg-mdt:client:accessResult', function(data)
    playerAccess.hasAccess = data.hasAccess
    playerAccess.permissions = data.permissions
    playerAccess.jobLabel = data.jobLabel
end)

RegisterNetEvent('rsg-mdt:client:permissionResult', function(data)
    TriggerEvent('rsg-mdt:permissionChecked', data.permission, data.hasPermission)
end)

RegisterNetEvent('rsg-mdt:client:configUpdated', function(version)
    RefreshMDTAccess()
end)

RegisterNetEvent('rsg-mdt:client:notify', function(data)
    if data.type == 'success' then
        lib.notify({ title = 'MDT', description = data.message, type = 'success' })
    elseif data.type == 'error' then
        lib.notify({ title = 'MDT', description = data.message, type = 'error' })
    else
        lib.notify({ title = 'MDT', description = data.message })
    end
end)

RegisterNetEvent('rsg-mdt:client:receiveConfig', function(data)
    TriggerEvent('rsg-mdt:configReceived', data)
end)

-- ============================================
-- Initialization
-- ============================================
CreateThread(function()
    Wait(2000)
    RefreshMDTAccess()
end)

RegisterNetEvent('RSGCore:Client:OnPlayerLoaded', function()
    Wait(1000)
    RefreshMDTAccess()
end)

RegisterNetEvent('RSGCore:Player:SetPlayerData', function(data)
    if data.job then
        Wait(500)
        RefreshMDTAccess()
    end
end)

-- ============================================
-- MDT Command
-- ============================================
RegisterCommand('mdt', function()
    if not HasMDTAccess() then
        lib.notify({ title = 'MDT', description = 'Only law enforcement on duty can access the MDT', type = 'error' })
        return
    end
    
    if isOpen then
        NUI.Close()
        isOpen = false
    else
        local officerInfo = lib.callback.await('rsg-mdt:server:getOfficerInfo')
        NUI.Open({ officer = officerInfo, permissions = GetMDTPermissions() })
        isOpen = true
    end
end, false)

-- RedM-compatible keybind using ox_lib
lib.addKeybind({
    name = 'mdt',
    description = 'Open MDT',
    defaultKey = 'F7',
    onPressed = function()
        ExecuteCommand('mdt')
    end
})

-- ============================================
-- NUI Callbacks
-- ============================================
RegisterNuiCallback('close', function(_, cb)
    NUI.Close()
    isOpen = false
    cb({ success = true })
end)

-- Citizens
RegisterNuiCallback('searchCitizens', function(data, cb)
    local results = lib.callback.await('rsg-mdt:server:searchCitizens', false, data.query)
    cb(results or {})
end)

RegisterNuiCallback('getCitizen', function(data, cb)
    local citizen = lib.callback.await('rsg-mdt:server:getCitizen', false, data.citizenid)
    cb(citizen or {})
end)

RegisterNuiCallback('setProfilePicture', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:setProfilePicture', false, data)
    cb({ success = success })
end)

-- Records
RegisterNuiCallback('getRecords', function(data, cb)
    local records = lib.callback.await('rsg-mdt:server:getRecords', false, data.citizenid)
    cb(records or {})
end)

RegisterNuiCallback('addRecord', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:addRecord', false, data)
    cb({ success = success })
end)

RegisterNuiCallback('deleteRecord', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:deleteRecord', false, data.id)
    cb({ success = success })
end)

-- Warrants
RegisterNuiCallback('getWarrants', function(_, cb)
    local warrants = lib.callback.await('rsg-mdt:server:getWarrants')
    cb(warrants or {})
end)

RegisterNuiCallback('addWarrant', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:addWarrant', false, data)
    cb({ success = success })
end)

RegisterNuiCallback('updateWarrant', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:updateWarrant', false, data)
    cb({ success = success })
end)

RegisterNuiCallback('deleteWarrant', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:deleteWarrant', false, data.id)
    cb({ success = success })
end)

-- BOLOs
RegisterNuiCallback('getBolos', function(_, cb)
    local bolos = lib.callback.await('rsg-mdt:server:getBolos')
    cb(bolos or {})
end)

RegisterNuiCallback('addBolo', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:addBolo', false, data)
    cb({ success = success })
end)

RegisterNuiCallback('deleteBolo', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:deleteBolo', false, data.id)
    cb({ success = success })
end)

-- Reports
RegisterNuiCallback('getReports', function(_, cb)
    local reports = lib.callback.await('rsg-mdt:server:getReports')
    cb(reports or {})
end)

RegisterNuiCallback('getReport', function(data, cb)
    local report = lib.callback.await('rsg-mdt:server:getReport', false, data.id)
    cb(report or {})
end)

RegisterNuiCallback('createReport', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:createReport', false, data)
    cb({ success = success })
end)

RegisterNuiCallback('deleteReport', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:deleteReport', false, data.id)
    cb({ success = success })
end)

RegisterNuiCallback('getReportComments', function(data, cb)
    local comments = lib.callback.await('rsg-mdt:server:getReportComments', false, data.reportId)
    cb(comments or {})
end)

RegisterNuiCallback('addReportComment', function(data, cb)
    local success = lib.callback.await('rsg-mdt:server:addReportComment', false, data)
    cb({ success = success })
end)

-- Officer Info
RegisterNuiCallback('getOfficerInfo', function(_, cb)
    local info = lib.callback.await('rsg-mdt:server:getOfficerInfo')
    cb(info or {})
end)

-- Stats
RegisterNuiCallback('getStats', function(_, cb)
    local stats = lib.callback.await('rsg-mdt:server:getStats')
    cb(stats or {})
end)

-- Config
RegisterNuiCallback('getIncidentTypes', function(_, cb)
    local types = lib.callback.await('rsg-mdt:server:getIncidentTypes')
    cb(types or {})
end)
