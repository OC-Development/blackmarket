fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'corex_blackmarket'
author 'CoreX'
description 'Standalone Black Market shop (QBCore + ox_inventory support)'
version '1.0.0'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/assets/*.svg'
}

shared_script 'config.lua'
client_script 'client/main.lua'
server_script 'server/main.lua'
