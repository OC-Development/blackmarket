const BlackMarketApp = (() => {
  // Application State
  const state = {
    isOpen: false,
    currentTab: 'buy',
    isLoading: false,
    data: {
      buy: { items: [], blackItems: [], currency: 'cash' },
      sell: { enabled: false, items: {}, multiplier: 1.0 }
    }
  };

  // DOM Elements
  const elements = {
    root: document.getElementById('app'),
    loading: document.getElementById('loading'),
    status: document.getElementById('status'),
    toast: document.getElementById('toast'),
    
    // Tabs
    tabBuy: document.getElementById('tab-buy'),
    tabSell: document.getElementById('tab-sell'),
    
    // Views
    viewBuy: document.getElementById('view-buy'),
    viewSell: document.getElementById('view-sell'),
    
    // Grids
    buyGrid: document.getElementById('buy-grid'),
    sellGrid: document.getElementById('sell-grid'),
    
    // Controls
    closeBtn: document.getElementById('close-btn')
  };

  // Utility Functions
  const utils = {
    formatNumber: (value) => {
      try {
        return new Intl.NumberFormat('en-US').format(value);
      } catch (e) {
        return value.toString();
      }
    },

    formatCurrency: (value, currency = 'cash') => {
      const symbol = currency === 'bank' ? '🏦' : '💵';
      return `${symbol} $${utils.formatNumber(value)}`;
    },

    createElement: (tag, className, content) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (content) element.textContent = content;
      return element;
    },

    playSound: (type) => {
      // Placeholder for sound effects
      console.log(`Playing sound: ${type}`);
    },

    vibrate: (pattern = [100]) => {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    }
  };

  // Toast Notification System
  const toast = {
    show: (type, title, message, duration = 3000) => {
      const toastEl = elements.toast;
      const titleEl = toastEl.querySelector('.toast-title');
      const messageEl = toastEl.querySelector('.toast-message');
      const closeEl = toastEl.querySelector('.toast-close');

      // Set content
      titleEl.textContent = title;
      messageEl.textContent = message;

      // Set type
      toastEl.className = `toast-notification ${type}`;

      // Show toast
      toastEl.classList.remove('hidden');
      utils.playSound(type);
      utils.vibrate(type === 'success' ? [100] : [100, 50, 100]);

      // Auto hide
      const hideTimeout = setTimeout(() => {
        toast.hide();
      }, duration);

      // Manual close
      closeEl.onclick = () => {
        clearTimeout(hideTimeout);
        toast.hide();
      };
    },

    hide: () => {
      elements.toast.classList.add('hidden');
    },

    success: (title, message) => toast.show('success', title, message),
    error: (title, message) => toast.show('error', title, message),
    warning: (title, message) => toast.show('warning', title, message)
  };

  // Loading System
  const loading = {
    show: (message = 'ESTABLISHING SECURE CONNECTION...') => {
      state.isLoading = true;
      const loadingText = elements.loading.querySelector('.loading-text');
      loadingText.textContent = message;
      elements.loading.classList.remove('hidden');
    },

    hide: () => {
      state.isLoading = false;
      elements.loading.classList.add('hidden');
    }
  };

  // Tab Management
  const tabs = {
    switch: (tabName) => {
      if (state.currentTab === tabName) return;
      
      state.currentTab = tabName;
      
      // Update tab buttons
      elements.tabBuy.classList.toggle('active', tabName === 'buy');
      elements.tabSell.classList.toggle('active', tabName === 'sell');
      
      // Update views
      elements.viewBuy.classList.toggle('hidden', tabName !== 'buy');
      elements.viewSell.classList.toggle('hidden', tabName !== 'sell');
      
      // Play sound
      utils.playSound('tab_switch');
      utils.vibrate([50]);
    }
  };

  // Card Creation
  const cards = {
    createItemCard: (item, type = 'buy') => {
      const card = document.createElement('div');
      card.className = 'item-card';
      
      // Add hover effects
      card.addEventListener('mouseenter', () => {
        utils.playSound('hover');
      });

      const content = document.createElement('div');
      content.className = 'card-content';

      // Image
      const imageContainer = document.createElement('div');
      imageContainer.className = 'card-image';
      
      const image = document.createElement('img');
      image.src = item.image ? `assets/${item.image}` : 'assets/tools.svg';
      image.alt = item.label;
      image.onerror = () => {
        image.src = 'assets/tools.svg';
      };
      imageContainer.appendChild(image);

      // Info
      const info = document.createElement('div');
      info.className = 'card-info';

      const header = document.createElement('div');
      header.className = 'card-header';

      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = item.label || item.name;

      const subtitle = document.createElement('div');
      subtitle.className = 'card-subtitle';

      if (type === 'buy') {
        const typeSpan = document.createElement('span');
        typeSpan.className = `card-type ${item.type || 'regular'}`;
        typeSpan.textContent = item.type === 'black' ? 'BLACK MARKET' : 'REGULAR';
        subtitle.appendChild(typeSpan);
      } else {
        subtitle.textContent = `Unit Price: ${utils.formatCurrency(item.unitPrice || 0)}`;
      }

      header.appendChild(title);
      header.appendChild(subtitle);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'card-actions';

      if (type === 'buy') {
        const price = document.createElement('div');
        price.className = 'card-price';
        price.textContent = utils.formatCurrency(item.price || 0);

        const buyBtn = document.createElement('button');
        buyBtn.className = 'action-btn buy';
        buyBtn.innerHTML = '<span>🛒</span> ACQUIRE';
        buyBtn.onclick = (e) => {
          e.stopPropagation();
          actions.buyItem(item);
        };

        actions.appendChild(price);
        actions.appendChild(buyBtn);
      } else {
        const sellPrice = Math.floor((item.unitPrice || 0) * (state.data.sell.multiplier || 1));
        const price = document.createElement('div');
        price.className = 'card-price';
        price.textContent = utils.formatCurrency(sellPrice);

        const sellBtn = document.createElement('button');
        sellBtn.className = 'action-btn sell';
        sellBtn.innerHTML = '<span>💰</span> LIQUIDATE';
        sellBtn.onclick = (e) => {
          e.stopPropagation();
          actions.sellItem(item);
        };

        actions.appendChild(price);
        actions.appendChild(sellBtn);
      }

      info.appendChild(header);
      info.appendChild(actions);

      content.appendChild(imageContainer);
      content.appendChild(info);
      card.appendChild(content);

      return card;
    },

    createEmptyCard: (message, icon = '📦') => {
      const card = document.createElement('div');
      card.className = 'item-card empty-card';
      card.style.textAlign = 'center';
      card.style.padding = '40px 20px';
      card.style.opacity = '0.7';

      card.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">${icon}</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Items Available</div>
        <div style="font-size: 14px; color: var(--text-muted);">${message}</div>
      `;

      return card;
    }
  };

  // Actions
  const actions = {
    buyItem: (item) => {
      utils.playSound('click');
      utils.vibrate([100]);
      
      // Send to game
      fetch(`https://${GetParentResourceName()}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          type: item.type || 'regular'
        })
      }).catch(console.error);
    },

    sellItem: (item) => {
      utils.playSound('click');
      utils.vibrate([100]);
      
      // Send to game
      fetch(`https://${GetParentResourceName()}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name
        })
      }).catch(console.error);
    }
  };

  // Rendering
  const render = {
    buyView: () => {
      const grid = elements.buyGrid;
      grid.innerHTML = '';

      const allItems = [
        ...state.data.buy.items,
        ...state.data.buy.blackItems
      ];

      if (allItems.length === 0) {
        grid.appendChild(cards.createEmptyCard('The market is currently restocking', '🔒'));
        return;
      }

      // Sort items: black market items first
      allItems.sort((a, b) => {
        if (a.type === 'black' && b.type !== 'black') return -1;
        if (a.type !== 'black' && b.type === 'black') return 1;
        return 0;
      });

      allItems.forEach(item => {
        const card = cards.createItemCard(item, 'buy');
        grid.appendChild(card);
      });
    },

    sellView: () => {
      const grid = elements.sellGrid;
      grid.innerHTML = '';

      if (!state.data.sell.enabled) {
        grid.appendChild(cards.createEmptyCard('Liquidation services temporarily unavailable', '🚫'));
        return;
      }

      const sellItems = Object.entries(state.data.sell.items || {});
      
      if (sellItems.length === 0) {
        grid.appendChild(cards.createEmptyCard('No items available for liquidation', '📦'));
        return;
      }

      sellItems.forEach(([name, data]) => {
        const item = {
          name,
          label: data.label || name,
          unitPrice: data.unitPrice || 0,
          image: data.image
        };
        
        const card = cards.createItemCard(item, 'sell');
        grid.appendChild(card);
      });
    }
  };

  // App Control
  const app = {
    open: () => {
      if (state.isOpen) return;
      
      state.isOpen = true;
      elements.root.classList.remove('hidden');
      loading.show('ACCESSING BLACK MARKET...');
      
      // Switch to buy tab by default
      tabs.switch('buy');
      
      utils.playSound('open');
      utils.vibrate([200, 100, 200]);
    },

    close: () => {
      if (!state.isOpen) return;
      
      state.isOpen = false;
      elements.root.classList.add('hidden');
      loading.hide();
      toast.hide();
      
      // Notify game
      fetch(`https://${GetParentResourceName()}/close`, {
        method: 'POST'
      }).catch(console.error);
      
      utils.playSound('close');
    },

    updateData: (newData) => {
      state.data = {
        buy: {
          items: newData.items || [],
          blackItems: newData.blackItems || [],
          currency: (newData.buy && newData.buy.currency) || 'cash'
        },
        sell: newData.sell || { enabled: false, items: {}, multiplier: 1.0 }
      };

      // Update status
      const totalItems = state.data.buy.items.length + state.data.buy.blackItems.length;
      elements.status.textContent = `${totalItems} ITEMS AVAILABLE`;

      // Re-render current view
      if (state.currentTab === 'buy') {
        render.buyView();
      } else {
        render.sellView();
      }

      loading.hide();
    }
  };

  // Event Listeners
  const initEventListeners = () => {
    // Tab switching
    elements.tabBuy.addEventListener('click', () => tabs.switch('buy'));
    elements.tabSell.addEventListener('click', () => tabs.switch('sell'));
    
    // Close button
    elements.closeBtn.addEventListener('click', app.close);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!state.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          app.close();
          break;
        case '1':
          tabs.switch('buy');
          break;
        case '2':
          tabs.switch('sell');
          break;
      }
    });

    // NUI Message Handler
    window.addEventListener('message', (event) => {
      const { action, payload, kind, message } = event.data || {};
      
      switch (action) {
        case 'open':
          app.open();
          break;
          
        case 'close':
          app.close();
          break;
          
        case 'data':
          app.updateData(payload);
          break;
          
        case 'toast':
          const titles = {
            success: 'TRANSACTION SUCCESSFUL',
            error: 'TRANSACTION FAILED',
            warning: 'WARNING'
          };
          toast.show(kind, titles[kind] || 'NOTIFICATION', message || '');
          break;
      }
    });
  };

  // Initialize
  const init = () => {
    initEventListeners();
    console.log('Black Market UI initialized');
  };

  // Public API
  return {
    init,
    open: app.open,
    close: app.close,
    toast,
    loading
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  BlackMarketApp.init();
  
  // Expose to global scope for debugging
  window.BlackMarketApp = BlackMarketApp;
});

// Fallback for GetParentResourceName
if (typeof GetParentResourceName === 'undefined') {
  window.GetParentResourceName = () => 'corex_blackmarket';
}