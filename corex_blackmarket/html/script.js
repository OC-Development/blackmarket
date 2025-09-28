const App = (()=>{
  const state = {
    open: false,
    buy: { items: [], black: [], currency: 'cash' },
    sell: { enabled: false, items: {}, multiplier: 1.0 },
  };

  const els = {
    root: document.getElementById('app'),
    status: document.getElementById('status'),
    toast: document.getElementById('toast'),
    tabBuy: document.getElementById('tab-buy'),
    tabSell: document.getElementById('tab-sell'),
    viewBuy: document.getElementById('view-buy'),
    viewSell: document.getElementById('view-sell'),
    buyGrid: document.getElementById('buy-grid'),
    sellGrid: document.getElementById('sell-grid'),
    close: document.getElementById('close-btn'),
  };

  function nf(v){ try{ return new Intl.NumberFormat('en-US').format(v) }catch(e){ return v } }

  function showToast(kind, msg){
    els.toast.className = 'toast ' + (kind || '');
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    setTimeout(()=>els.toast.classList.add('hidden'), 1800);
  }

  function setStatus(msg){ els.status.textContent = msg || '' }

  function setTab(which){
    if(which === 'buy'){
      els.tabBuy.classList.add('active'); els.tabSell.classList.remove('active');
      els.viewBuy.classList.remove('hidden'); els.viewSell.classList.add('hidden');
    } else {
      els.tabSell.classList.add('active'); els.tabBuy.classList.remove('active');
      els.viewSell.classList.remove('hidden'); els.viewBuy.classList.add('hidden');
    }
  }

  function card({image,label,subtitle,buttons}){
    const div = document.createElement('div'); div.className = 'card';
    const pic = document.createElement('div'); pic.className = 'pic';
    if(image && image.endsWith('.svg')){
      const img = document.createElement('img'); img.src = 'assets/' + image; pic.appendChild(img);
    } else {
      const img = document.createElement('img'); img.src = 'assets/tools.svg'; pic.appendChild(img);
    }
    const meta = document.createElement('div'); meta.className = 'meta';
    const title = document.createElement('div'); title.className = 'title'; title.textContent = label;
    const sub = document.createElement('div'); sub.className = 'subtitle'; sub.textContent = subtitle || '';
    const actions = document.createElement('div'); actions.className = 'actions';
    (buttons||[]).forEach(b => {
      const btn = document.createElement('button'); btn.className = 'btn small ' + (b.ghost?'ghost':'');
      btn.textContent = b.label; btn.onclick = b.onClick;
      actions.appendChild(btn);
    });
    meta.appendChild(title); meta.appendChild(sub); meta.appendChild(actions);
    div.appendChild(pic); div.appendChild(meta);
    return div;
  }

  function renderBuy(){
    els.buyGrid.innerHTML = '';
    const all = [...state.buy.items, ...state.buy.black];
    all.forEach(it => {
      const c = card({
        image: it.image || 'tools.svg',
        label: it.label,
        subtitle: `$${nf(it.price)} • ${it.type === 'black' ? 'Black Market' : 'Regular'}`,
        buttons: [{
          label: 'Buy 1', onClick: ()=> fetch(`https://${GetParentResourceName()}/buy`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name: it.name, type: it.type })
          })
        }]
      });
      els.buyGrid.appendChild(c);
    });
  }

  function renderSell(){
    els.sellGrid.innerHTML = '';
    if(!state.sell.enabled){
      els.sellGrid.appendChild(card({ image:'tools.svg', label:'Selling Disabled', subtitle:'Come back later.' }));
      return;
    }
    Object.entries(state.sell.items).forEach(([name,data])=>{
      const subtitle = `Unit $${nf(Math.floor((data.unitPrice||0)*(state.sell.multiplier||1)))} `;
      const c = card({
        image: data.image || 'consumables.svg',
        label: data.label || name,
        subtitle,
        buttons: [{
          label: 'Sell 1', onClick: ()=> fetch(`https://${GetParentResourceName()}/sell`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name })
          })
        }]
      });
      els.sellGrid.appendChild(c);
    });
  }

  function open(){
    state.open = true;
    els.root.classList.remove('hidden');
    setTab('buy');
    setStatus('');
  }
  function close(){
    state.open = false;
    els.root.classList.add('hidden');
    setStatus('');
    fetch(`https://${GetParentResourceName()}/close`, {method:'POST'});
  }

  // Event wiring
  els.tabBuy.onclick = ()=> setTab('buy');
  els.tabSell.onclick = ()=> setTab('sell');
  els.close.onclick = ()=> close();

  window.addEventListener('message', (e)=>{
    const { action, payload, kind, message } = e.data || {};
    if(action === 'open'){ open(); setStatus('Loading ...'); }
    else if(action === 'close'){ close(); }
    else if(action === 'data'){
      setStatus('');
      state.buy.items = payload.items || [];
      state.buy.black = payload.blackItems || [];
      state.buy.currency = (payload.buy && payload.buy.currency) || 'cash';
      state.sell = payload.sell || {enabled:false, items:{}, multiplier:1};
      renderBuy();
      renderSell();
    } else if(action === 'toast'){
      showToast(kind, message || '');
    }
  });

  // ESC support (FiveM sends keyup to game; UI receives focus only)
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ close(); }
  });

  return { renderBuy, renderSell };
})();

// NUI callbacks
window.addEventListener('DOMContentLoaded', ()=>{
  // expose to game runtime
  window.__corex_bm = App;
});
