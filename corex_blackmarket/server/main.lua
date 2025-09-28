local QBCore = exports['qb-core']:GetCoreObject()

local function usingOx()
    return GetResourceState('ox_inventory') == 'started'
end

local function addItem(src, name, amount, info, slot)
    if usingOx() then
        return exports.ox_inventory:AddItem(src, name, amount or 1, info or nil, slot)
    else
        local Player = QBCore.Functions.GetPlayer(src)
        if not Player then return false end
        return Player.Functions.AddItem(name, amount or 1, false, info or {})
    end
end

local function removeItem(src, name, amount, slot)
    if usingOx() then
        return exports.ox_inventory:RemoveItem(src, name, amount or 1, nil, slot)
    else
        local Player = QBCore.Functions.GetPlayer(src)
        if not Player then return false end
        return Player.Functions.RemoveItem(name, amount or 1, slot or false)
    end
end

local function getItemCount(src, name)
    if usingOx() then
        return exports.ox_inventory:Search(src, 'count', name) or 0
    else
        local Player = QBCore.Functions.GetPlayer(src)
        if not Player then return 0 end
        local item = Player.Functions.GetItemByName(name)
        return item and item.amount or 0
    end
end

local function getIdentifiers(src)
    local ids = {license=nil, discord=nil, steam=nil}
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if id:sub(1,8) == 'license:' then ids.license = id
        elseif id:sub(1,8) == 'discord:' then ids.discord = id:sub(9)
        elseif id:sub(1,6) == 'steam:' then ids.steam = id end
    end
    return ids
end

local function hasAccess(src)
    local ids = getIdentifiers(src)
    if not Config.Access then return true end
    if Config.Access.licenses then
        for _, lic in ipairs(Config.Access.licenses) do
            if ids.license == lic then return true end
        end
    end
    if Config.Access.discord then
        for _, did in ipairs(Config.Access.discord) do
            if ids.discord == tostring(did) then return true end
        end
    end
    -- default deny if any list provided; allow if both empty
    local hasLists = (Config.Access.licenses and next(Config.Access.licenses)) or (Config.Access.discord and next(Config.Access.discord))
    return not hasLists
end

local function canSeeBlack(src, Player)
    Player = Player or QBCore.Functions.GetPlayer(src)
    if not Player then return false end
    if Config.BlackMarketKeyItem and getItemCount(src, Config.BlackMarketKeyItem) > 0 then
        return true
    end
    local gang = (Player.PlayerData.gang and Player.PlayerData.gang.name) or nil
    return gang ~= nil
end

RegisterNetEvent('corex_bm:open', function()
    local src = source
    if not hasAccess(src) then
        TriggerClientEvent('corex_bm:denyOpen', src, 'Access denied.')
        return
    end
    TriggerClientEvent('corex_bm:allowOpen', src)
end)

RegisterNetEvent('corex_bm:requestItems', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local canSee = canSeeBlack(src, Player)

    -- build buy list (filter by whitelist if enabled; filter black items by access/gang/key)
    local buyItems = {}
    if Config.Buy and Config.Buy.enabled then
        for name, data in pairs(Config.Buy.items or {}) do
            if (not Config.Buy.useWhitelist) or (Config.Buy.useWhitelist and Config.Buy.items[name]) then
                buyItems[#buyItems+1] = { name=name, label=data.label, price=data.basePrice, image=data.image or '', category=data.category or nil, type='regular' }
            end
        end
    end

    local blackItems = {}
    for name, data in pairs(Config.BlackMarketItems or {}) do
        -- gate on gang/key
        local ok = false
        if canSee then
            if data.allowedGangs == nil or next(data.allowedGangs) == nil then
                ok = true
            else
                local gang = (Player.PlayerData.gang and Player.PlayerData.gang.name) or nil
                if gang then
                    for _, g in ipairs(data.allowedGangs) do
                        if g == gang then ok = true break end
                    end
                end
            end
        end
        if ok then
            blackItems[#blackItems+1] = { name=name, label=data.label, price=data.basePrice, image=data.image or '', category=data.category or nil, type='black' }
        end
    end

    local sellCfg = Config.Sell or { enabled=false }
    local buyCfg = { enabled = Config.Buy and Config.Buy.enabled or false, currency = Config.Buy and Config.Buy.currency or 'cash' }

    TriggerClientEvent('corex_bm:sendItems', src, {
        categories = Config.Categories or {},
        items = buyItems,
        blackItems = blackItems,
        sell = { enabled = sellCfg.enabled, items = sellCfg.items or {}, multiplier = Config.SellMultiplier or 1.0 },
        buy = buyCfg
    })
end)

RegisterNetEvent('corex_bm:sellItem', function(name)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    if not (Config.Sell and Config.Sell.enabled) then
        TriggerClientEvent('corex_bm:sellResult', src, false, 'Selling is disabled.')
        return
    end
    if Config.Sell.useWhitelist and not Config.Sell.items[name] then
        TriggerClientEvent('corex_bm:sellResult', src, false, 'Item not sellable.')
        return
    end

    local have = getItemCount(src, name)
    if have <= 0 then
        TriggerClientEvent('corex_bm:sellResult', src, false, 'You have none to sell.')
        return
    end

    local unit = Config.Sell.items[name] and Config.Sell.items[name].unitPrice or 0
    local amountToSell = 1
    local total = math.floor((unit * amountToSell) * (Config.SellMultiplier or 1.0))

    local removed = removeItem(src, name, amountToSell)
    if not removed then
        TriggerClientEvent('corex_bm:sellResult', src, false, 'Failed to remove item.')
        return
    end

    local currency = Config.Buy and Config.Buy.currency or 'cash' -- pay with same account
    Player.Functions.AddMoney(currency, total, 'corex_bm:sell')

    TriggerClientEvent('corex_bm:sellResult', src, true, ('Sold 1x for $%s'):format(total))
end)

RegisterNetEvent('corex_bm:buyItem', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    if not (Config.Buy and Config.Buy.enabled) then
        TriggerClientEvent('corex_bm:buyResult', src, false, 'Buying is disabled.')
        return
    end

    local name = data.name
    local isBlack = data.type == 'black'
    local pool = isBlack and Config.BlackMarketItems or (Config.Buy.items or {})
    local item = pool[name]
    if not item then
        TriggerClientEvent('corex_bm:buyResult', src, false, 'Invalid item.')
        return
    end

    -- black market gating
    if isBlack then
        local canSee = false
        if Config.BlackMarketKeyItem and getItemCount(src, Config.BlackMarketKeyItem) > 0 then
            canSee = true
        end
        local gang = (Player.PlayerData.gang and Player.PlayerData.gang.name) or nil
        if gang then canSee = true end
        if item.allowedGangs and next(item.allowedGangs) then
            canSee = false
            if gang then
                for _, g in ipairs(item.allowedGangs) do
                    if g == gang then canSee = true break end
                end
            end
        end
        if not canSee then
            TriggerClientEvent('corex_bm:buyResult', src, false, 'You cannot access this item.')
            return
        end
    end

    local price = item.basePrice
    local currency = Config.Buy.currency or 'cash'
    if Player.Functions.RemoveMoney(currency, price, 'corex_bm:buy') then
        local ok = addItem(src, name, 1, {})
        if ok then
            TriggerClientEvent('corex_bm:buyResult', src, true, ('Purchased %s for $%s'):format(item.label, price))
        else
            -- refund if add failed
            Player.Functions.AddMoney(currency, price, 'corex_bm:refund')
            TriggerClientEvent('corex_bm:buyResult', src, false, 'Inventory full.')
        end
    else
        TriggerClientEvent('corex_bm:buyResult', src, false, 'Not enough money.')
    end
end)
