Config = {}

-- === NPC / Access ===
Config.NPC = {
    model = 's_m_m_armoured_02',
    scenario = 'WORLD_HUMAN_STAND_IMPATIENT',
    blip = {
        enabled = false, sprite = 500, color = 40, scale = 0.7, label = 'Black Market'
    },
    useTarget = true,
    locations = {
        -- Add as many as you want
        { x = 707.91, y = -966.95, z = 30.41, heading = 180.0 },
    }
}

-- NOTE: access check accepts either a matching license or discord id (as string)
Config.Access = {
    licenses = {
        -- 'license:27d8fbc6370ed3182f15ca587e74f55e8ef64d23',
    },
    discord = {
        -- '123456789012345678',
    }
}

-- Optional: require a key item to view black market items (nil = disabled)
Config.BlackMarketKeyItem = nil -- e.g. 'blackkey'

-- Multiplier applied to computed sell price (keep <= 1.0 usually)
Config.SellMultiplier = 0.9

-- === SELL ===
Config.Sell = {
    enabled = true,
    useWhitelist = true, -- when true: only items listed below are sellable
    items = {
        -- name = { label=..., unitPrice=... }
        pistol_ammo = { label = 'Pistol Ammo', unitPrice = 75 },
        rifle_ammo  = { label = 'Rifle Ammo',  unitPrice = 120 },
        copper      = { label = 'Copper',      unitPrice = 8 },
        goldore     = { label = 'Gold Ore',    unitPrice = 180 },
    }
}

-- === BUY ===
Config.Buy = {
    enabled = true,
    useWhitelist = false, -- when true: only items listed below are buyable
    currency = 'cash', -- 'cash' or 'bank'
    items = {
        -- name = { label=..., basePrice=..., image='(optional path in html/assets)', category='(optional)', allowedGangs={'ballas','police'} }
        lockpick        = { label='Lockpick', basePrice=400, image='lockpick.svg' },
        armor           = { label='Armor Plate', basePrice=1500, image='armor.svg' },
        pistol_ammo     = { label='Pistol Ammo', basePrice=150, image='ammo.svg' },
        rifle_ammo      = { label='Rifle Ammo',  basePrice=260, image='ammo.svg' },
        handgun_parts   = { label='Handgun Parts', basePrice=980, image='attachment.svg'},
    }
}

-- Optional categories definition (IDs are useful for UI image mapping even if UI doesn't show category cards)
Config.Categories = {
    { id='weapons',      label='Weapons',      icon='weapons.svg' },
    { id='ammo',         label='Ammo',         icon='ammo.svg' },
    { id='attachments',  label='Attachments',  icon='attachment.svg' },
    { id='tools',        label='Tools',        icon='tools.svg' },
    { id='consumables',  label='Consumables',  icon='consumables.svg' },
}

-- Items reserved for the black market (hidden unless player has gang access or key item)
Config.BlackMarketItems = {
    -- advanced_lockpick = { label='Advanced Lockpick', basePrice=1200, image='lockpick.svg', category='tools' },
    -- smg_ammo          = { label='SMG Ammo',          basePrice=340,  image='ammo.svg',    category='ammo' },
}
