NUI = {}
local isOpen = false

-- Window state (persisted across sessions)
-- Position is managed by UI; Lua only stores size for persistence
local windowState = {
    width = 1100,
    height = 700,
}

--- Send a message to the UI
---@param action string The action name the UI listens for
---@param data? table Optional data payload
function NUI.SendMessage(action, data)
    SendNuiMessage(json.encode({ action = action, data = data or {} }))
end

--- Set UI visibility without changing focus
---@param visible boolean
function NUI.SetVisibility(visible)
    NUI.SendMessage('setVisible', { visible = visible })
end

--- Set NUI focus (keyboard/mouse capture)
---@param hasFocus boolean
---@param hasCursor boolean|nil Defaults to hasFocus if not provided
function NUI.SetFocus(hasFocus, hasCursor)
    SetNuiFocus(hasFocus, hasCursor ~= false and hasFocus)
end

--- Open the UI with optional data
---@param data? table Data to pass to UI on open
function NUI.Open(data)
    if isOpen then return end
    isOpen = true
    NUI.SetFocus(true, true)
    
    -- Merge window config with data (UI handles centering)
    local openData = data or {}
    openData.window = {
        width = windowState.width,
        height = windowState.height,
    }
    
    NUI.SendMessage('open', openData)
end

--- Close the UI and release focus
function NUI.Close()
    if not isOpen then return end
    isOpen = false
    NUI.SetFocus(false, false)
    NUI.SendMessage('close')
end

--- Check if UI is currently open
---@return boolean
function NUI.IsOpen()
    return isOpen
end

--- Get current window state
---@return table
function NUI.GetWindowState()
    return {
        width = windowState.width,
        height = windowState.height,
    }
end

--- Set window state
---@param state table
function NUI.SetWindowState(state)
    if state.width then windowState.width = state.width end
    if state.height then windowState.height = state.height end
end

-- Register close callback from UI
RegisterNuiCallback('close', function(_, cb)
    NUI.Close()
    cb({ success = true })
end)

-- Register window resize callback
RegisterNuiCallback('windowResize', function(data, cb)
    if data.width and data.height then
        windowState.width = data.width
        windowState.height = data.height
    end
    cb({ success = true })
end)
