(function(){
  const WA_NUMBER = '256786722322'; // WhatsApp number (no +)
  const form = document.getElementById('orderForm');

  function buildMessage(values){
    let lines = [];
    lines.push('Tshabzel Order');
    lines.push('--------------------');
    lines.push(`Name: ${values.name || ''}`);
    if(values.email) lines.push(`Email: ${values.email}`);
    lines.push(`Phone: ${values.phone || ''}`);
    lines.push(`Product: ${values.product || ''}`);
    if(values.size) lines.push(`Size/Measurements: ${values.size}`);
    lines.push(`Quantity: ${values.quantity || 1}`);
    if(values.address) lines.push(`Address: ${values.address}`);
    if(values.notes) lines.push(`Notes: ${values.notes}`);
    lines.push('--------------------');
    lines.push('Please confirm availability and next steps.');
    return lines.join('\n');
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const values = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      product: document.getElementById('product').value.trim(),
      size: document.getElementById('size').value.trim(),
      quantity: document.getElementById('quantity').value,
      address: document.getElementById('address').value.trim(),
      notes: document.getElementById('notes').value.trim(),
    };

    if(!values.name || !values.phone || !values.product){
      alert('Please fill Name, Phone and Product fields.');
      return;
    }

    const message = buildMessage(values);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in new tab (works with mobile and desktop)
    window.open(url, '_blank');
  });

  // Product card order buttons
  function productOrderHandler(e){
    const btn = e.currentTarget;
    const name = btn.getAttribute('data-name') || '';
    const price = btn.getAttribute('data-price') || '';

    const messageLines = [
      'Tshabzel Product Order',
      '--------------------',
      `Product: ${name}`,
      `Price: ${price}`,
      'Quantity: 1',
      '--------------------',
      'Please confirm availability and payment options.'
    ];

    const message = messageLines.join('\n');
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  document.querySelectorAll('.product-order').forEach(btn => {
    btn.addEventListener('click', productOrderHandler);
  });

  /* Shopping cart implementation */
  const cartToggle = document.getElementById('cartToggle');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartClose = document.getElementById('cartClose');
  const cartItemsEl = document.getElementById('cartItems');
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');
  const clearCartBtn = document.getElementById('clearCart');
  const checkoutBtn = document.getElementById('checkoutCart');

  let cart = [];

  function saveCart(){
    try{ localStorage.setItem('tshabzel_cart', JSON.stringify(cart)); }catch(e){}
  }

  function loadCart(){
    try{ const raw = localStorage.getItem('tshabzel_cart'); if(raw) cart = JSON.parse(raw) || [] }catch(e){cart=[]}
  }

  function formatPriceStr(p){
    // try to keep currency prefix and digits
    if(!p) return 'UGX 0';
    return p.toString();
  }

  function priceToNumber(priceStr){
    if(!priceStr) return 0;
    const digits = priceStr.replace(/[^0-9\.]/g,'');
    return Number(digits) || 0;
  }

  function updateCartUI(){
    cartItemsEl.innerHTML = '';
    if(cart.length === 0){
      cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      cartCountEl.textContent = '0';
      cartTotalEl.textContent = 'UGX 0';
      return;
    }

    cart.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.image || '#'}" alt="${item.name}">
        <div class="meta">
          <h4>${item.name}</h4>
          <p>${formatPriceStr(item.price)}</p>
        </div>
        <div class="qty">
          <button class="qty-dec" data-idx="${idx}">-</button>
          <div class="qty-value">${item.qty}</div>
          <button class="qty-inc" data-idx="${idx}">+</button>
          <button class="remove" data-idx="${idx}" style="margin-left:8px">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(div);
    });

    const total = cart.reduce((s,i)=> s + priceToNumber(i.price) * i.qty, 0);
    cartCountEl.textContent = String(cart.reduce((s,i)=>s+i.qty,0));
    cartTotalEl.textContent = `UGX ${total.toLocaleString()}`;

    // attach qty handlers
    cartItemsEl.querySelectorAll('.qty-inc').forEach(b=> b.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.dataset.idx);
      cart[idx].qty++;
      saveCart(); updateCartUI();
    }));
    cartItemsEl.querySelectorAll('.qty-dec').forEach(b=> b.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.dataset.idx);
      if(cart[idx].qty>1) cart[idx].qty--; else cart.splice(idx,1);
      saveCart(); updateCartUI();
    }));
    cartItemsEl.querySelectorAll('.remove').forEach(b=> b.addEventListener('click', e=>{
      const idx = Number(e.currentTarget.dataset.idx);
      cart.splice(idx,1); saveCart(); updateCartUI();
    }));
  }

  function addToCart(item){
    // merge if same name+price
    const found = cart.find(i=> i.name === item.name && i.price === item.price);
    if(found) found.qty += item.qty || 1; else cart.push(Object.assign({qty:1}, item));
    saveCart(); updateCartUI();
  }

  // Add-to-cart buttons: add items to cart without opening WhatsApp
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', function(e){
      e.preventDefault();
      const name = btn.getAttribute('data-name') || 'Item';
      const price = btn.getAttribute('data-price') || '';
      const img = btn.getAttribute('data-img') || '';
      addToCart({name, price, image: img, qty:1});
      // show cart
      cartSidebar.classList.add('open');
    });
  });

  cartToggle.addEventListener('click', ()=>{
    cartSidebar.classList.toggle('open');
  });
  cartClose.addEventListener('click', ()=> cartSidebar.classList.remove('open'));

  clearCartBtn.addEventListener('click', ()=>{ cart = []; saveCart(); updateCartUI(); });

  checkoutBtn.addEventListener('click', ()=>{
    if(cart.length===0){ alert('Your cart is empty'); return; }
    // build message
    const lines = ['Tshabzel Cart Order','--------------------'];
    cart.forEach((it, idx)=>{
      lines.push(`${idx+1}. ${it.name} x${it.qty} - ${it.price}`);
    });
    const total = cart.reduce((s,i)=> s + priceToNumber(i.price) * i.qty, 0);
    lines.push('--------------------');
    lines.push(`Total: UGX ${total.toLocaleString()}`);
    lines.push('Please confirm availability, sizes and delivery options.');

    const message = lines.join('\n');
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  });
  // Drag & drop: make product cards draggable and allow dropping onto cart
  document.querySelectorAll('.product-card').forEach(card => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', (e) => {
      const btn = card.querySelector('.product-order');
      const name = (btn && btn.getAttribute('data-name')) || (card.querySelector('h4') && card.querySelector('h4').textContent) || 'Item';
      const price = (btn && btn.getAttribute('data-price')) || (card.querySelector('.price') && card.querySelector('.price').textContent) || '';
      const img = (card.querySelector('img') && card.querySelector('img').getAttribute('src')) || '';
      const payload = { name: name.trim(), price: price.trim(), image: img };
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  // highlight and accept drops on cart sidebar
  cartSidebar.addEventListener('dragover', (e) => { e.preventDefault(); cartSidebar.classList.add('drag-over'); e.dataTransfer.dropEffect = 'copy'; });
  cartSidebar.addEventListener('dragleave', () => cartSidebar.classList.remove('drag-over'));
  cartSidebar.addEventListener('drop', (e) => {
    e.preventDefault(); cartSidebar.classList.remove('drag-over');
    const data = e.dataTransfer.getData('application/json');
    if(!data) return;
    try{
      const obj = JSON.parse(data);
      addToCart({ name: obj.name, price: obj.price, image: obj.image, qty: 1 });
      cartSidebar.classList.add('open');
    }catch(err){ }
  });

  // also allow dropping onto cart toggle button (quick add + open cart)
  cartToggle.addEventListener('dragover', (e) => { e.preventDefault(); cartToggle.classList.add('drag-over'); e.dataTransfer.dropEffect = 'copy'; });
  cartToggle.addEventListener('dragleave', () => cartToggle.classList.remove('drag-over'));
  cartToggle.addEventListener('drop', (e) => {
    e.preventDefault(); cartToggle.classList.remove('drag-over');
    const data = e.dataTransfer.getData('application/json');
    if(!data) return;
    try{
      const obj = JSON.parse(data);
      addToCart({ name: obj.name, price: obj.price, image: obj.image, qty: 1 });
      cartSidebar.classList.add('open');
    }catch(err){ }
  });

  // init
  loadCart(); updateCartUI();
})();
