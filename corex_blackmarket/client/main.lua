local QBCore = exports['qb-core']:GetCoreObject()

local uiOpen = false
local NearPrompt = false
local peds = {}

local function loadModel(model)
    local hash = type(model) == 'number' and model or GetHashKey(model)
    RequestModel(hash)
    while not HasModelLoaded(hash) do Wait(10) end
    return hash
end

local function spawnNPCs()
    for _, loc in ipairs(Config.NPC.locations or {}) do
        local hash = loadModel(Config.NPC.model or 's_m_m_armoured_02')
        local ped = CreatePed(4, hash, loc.x, loc.y, loc.z - 1.0, loc.heading or 0.0, false, true)
        SetEntityInvincible(ped, true)
        SetBlockingOfNonTemporaryEvents(ped, true)
        FreezeEntityPosition(ped, true)
        if Config.NPC.scenario then
            TaskStartScenarioInPlace(ped, Config.NPC.scenario, 0, true)
        end
        table.insert(peds, ped)

        if Config.NPC.blip and Config.NPC.blip.enabled then
            local bl = AddBlipForCoord(loc.x, loc.y, loc.z)
            SetBlipSprite(bl, Config.NPC.blip.sprite or 500)
            SetBlipColour(bl, Config.NPC.blip.color or 40)
            SetBlipScale(bl, Config.NPC.blip.scale or 0.7)
            SetBlipAsShortRange(bl, true)
            BeginTextCommandSetBlipName("STRING")
            AddTextComponentString(Config.NPC.blip.label or 'Black Market')
            EndTextCommandSetBlipName(bl)
        end

        if Config.NPC.useTarget and GetResourceState('qb-target') == 'started' then
            exports['qb-target']:AddTargetEntity(ped, {
                options = {
                    {
                        icon = 'fa-solid fa-shop',
                        label = 'Enter Black Market',
                        action = function()
                            TriggerServerEvent('corex_bm:open')
                        end
                    }
                },
                distance = 2.0
            })
        end
    end
end

local function openUI()
    if uiOpen then return end
    uiOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open' })
    TriggerServerEvent('corex_bm:requestItems')
end

local function closeUI()
    if not uiOpen then return end
    uiOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

RegisterNetEvent('corex_bm:denyOpen', function(msg)
    QBCore.Functions.Notify(msg or 'Access denied', 'error')
end)

RegisterNetEvent('corex_bm:allowOpen', function()
    openUI()
end)

RegisterNetEvent('corex_bm:sendItems', function(payload)
    SendNUIMessage({ action = 'data', payload = payload })
end)

RegisterNetEvent('corex_bm:sellResult', function(ok, msg)
    SendNUIMessage({ action = 'toast', kind = ok and 'success' or 'error', message = msg })
end)

RegisterNetEvent('corex_bm:buyResult', function(ok, msg)
    SendNUIMessage({ action = 'toast', kind = ok and 'success' or 'error', message = msg })
end)

-- NUI callbacks
RegisterNUICallback('close', function(_, cb)
    closeUI()
    cb(1)
end)

RegisterNUICallback('sell', function(data, cb)
    TriggerServerEvent('corex_bm:sellItem', data.name)
    cb(1)
end)

RegisterNUICallback('buy', function(data, cb)
    TriggerServerEvent('corex_bm:buyItem', data)
    cb(1)
end)

-- Fallback 3D prompt (E) when target not used
CreateThread(function()
    spawnNPCs()
    local useKey = not (Config.NPC.useTarget and GetResourceState('qb-target') == 'started')
    while true do
        Wait(0)
        if not useKey then
            Wait(500)
        else
            local ped = PlayerPedId()
            local pcoords = GetEntityCoords(ped)
            for _, loc in ipairs(Config.NPC.locations or {}) do
                local dist = #(pcoords - vector3(loc.x, loc.y, loc.z))
                if dist < 2.0 then
                    DrawMarker(2, loc.x, loc.y, loc.z + 0.1, 0,0,0, 0,0,0, 0.3,0.3,0.3, 255,0,0,150, false,false,2,true,nil,nil,false)
                    QBCore.Functions.DrawText3D(loc.x, loc.y, loc.z + 0.35, "~r~[E]~s~ Enter Black Market")
                    if IsControlJustPressed(0, 38) then -- E
                        TriggerServerEvent('corex_bm:open')
                        Wait(500)
                    end
                end
            end
        end
    end
end)

-- ESC to close
CreateThread(function()
    while true do
        if uiOpen then
            DisableControlAction(0, 200, true) -- ESC
            if IsDisabledControlJustPressed(0, 200) then
                closeUI()
            end
        end
        Wait(0)
    end
end)
