import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float, OrbitControls } from '@react-three/drei';
import { ArrowDown, ArrowRight, ArrowUpRight, Heart, Menu, Plus, ShoppingBag, Sparkles, Trash2, CreditCard, CircleCheck } from 'lucide-react';
import './style.css';
import DIYStudio from './diy-studio.jsx';

const palettes = [
  { name: 'Cherry pop', hex: '#e74365' }, { name: 'Butter', hex: '#f5ca54' },
  { name: 'Poolside', hex: '#46b9c5' }, { name: 'Lilac haze', hex: '#a991d6' },
  { name: 'Espresso', hex: '#49342f' }, { name: 'Cloud', hex: '#f4eee4' },
];

const finishes = ['Candy acrylic', 'Metallic'];

function Collection() {
  return <section className="collection" id="shop">
    <div className="collection-heading"><div><p className="eyebrow">THE EVERYDAY EDIT</p><h2>Meet your new<br/><i>favorite little thing.</i></h2></div><a href="#editor" className="text-link">DESIGN YOURS <ArrowUpRight size={15}/></a></div>
    <div className="product-card"><a className="product-image" href="#editor" aria-label="Watch the DIY demo and customize the CHARMLET signature clip"><img src="/images/charmlet-gemstone-collection.png" alt="A colorful collection of jeweled CHARMLET hair clips"/><div className="diy-demo" aria-hidden="true"><div className="demo-library"><span className="demo-step">01 / PICK A GEM</span><div className="demo-gem-sample sample-one"/><div className="demo-gem-sample sample-two"/><div className="demo-gem-sample sample-three"/><small>ROUND · PINK</small></div><div className="demo-stage"><span className="demo-step">02 / PLACE ON YOUR CLIP</span><div className="demo-clip"><i className="demo-stone stone-a"/><i className="demo-stone stone-b"/><i className="demo-stone stone-c"/><i className="demo-stone stone-new"/></div><span className="demo-confirm">✓ &nbsp; GEM ADDED</span></div><div className="demo-drag-gem"/><span className="demo-cursor">↖</span><span className="demo-hint">DRAG · PLACE · MAKE IT YOURS</span></div><span className="product-badge">MADE TO BE YOURS <b>↗</b></span><span className="demo-play">▶ &nbsp; LIVE DIY DEMO</span></a><div className="product-info"><div><span>01 / THE SIGNATURE CLIP</span><h3>A clip, your way</h3><p>Choose your size, color and favorite gemstones.</p></div><a href="#editor" className="circle-link">MAKE<br/>YOURS <ArrowUpRight size={15}/></a></div></div>
    <p className="collection-note">Small 60 × 20 mm · Medium 85 × 25 mm</p>
  </section>
}

function Clip({ color, finish, size, detail }) {
  const scale = size.startsWith('Medium') ? 1.18 : 0.9;
  const metal = finish === 'Metallic';
  return <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.25}>
    <group rotation={[0.05, 0.1, -0.24]} scale={scale}>
      <mesh castShadow position={[0, 0, 0]}><capsuleGeometry args={[0.35, 2.05, 8, 24]} /><meshStandardMaterial color={metal?'#c9a66b':color} roughness={metal?0.2:0.24} metalness={metal?0.82:0.03} /></mesh>
      <mesh castShadow position={[0, -1.15, 0.02]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.34, 0.75, 24]} /><meshStandardMaterial color={metal?'#c9a66b':color} roughness={metal?0.2:0.24} metalness={metal?0.82:0.03} /></mesh>
      <mesh position={[0, 0.15, 0.33]}><torusGeometry args={[0.27, 0.045, 12, 32]} /><meshStandardMaterial color="#fff4de" metalness={0.6} roughness={0.25} /></mesh>
      <mesh position={[0, -0.46, 0.36]}><sphereGeometry args={[0.13, 24, 16]} /><meshStandardMaterial color={detail==='Crystal'?'#b8d9db':'#fff4de'} metalness={detail==='Crystal'?0.22:0.4} roughness={detail==='Crystal'?0.08:0.2} /></mesh>
    </group>
  </Float>;
}

function Studio() {
  const [color, setColor] = useState(palettes[0]);
  const [finish, setFinish] = useState(finishes[0]);
  const [size, setSize] = useState('Small · 60 × 20 mm');
  const [detail, setDetail] = useState('Classic');
  const [added, setAdded] = useState(false);
  return <section className="studio" id="studio">
    <div className="studio-copy"><p className="eyebrow"><a href="#shop">← BACK TO THE COLLECTION</a><span>YOUR DESIGN</span></p><h2>Make it<br/><i>your kind.</i></h2><p className="studio-intro">Build your everyday favorite. Your choices update the 3D preview as you go.</p>
      <div className="picker-label"><span>01 — SIZE</span></div><div className="choice-row">{['Small · 60 × 20 mm','Medium · 85 × 25 mm'].map(v=><button className={size===v?'choice active':'choice'} onClick={()=>setSize(v)} key={v}>{v.split(' · ')[0]}<small>{v.split(' · ')[1]}</small></button>)}</div>
      <div className="picker-label"><span>02 — FINISH</span></div><div className="choice-row">{finishes.map(v=><button className={finish===v?'choice active':'choice'} onClick={()=>setFinish(v)} key={v}>{v}</button>)}</div>
      <div className="picker-label"><span>03 — COLOR</span><b>{color.name}</b></div><div className="swatches">{palettes.map(p => <button key={p.name} className={`swatch ${color.name===p.name?'selected':''}`} aria-label={p.name} title={p.name} style={{background:p.hex}} onClick={()=>setColor(p)} />)}</div>
      <div className="picker-label"><span>04 — DETAIL</span></div><div className="choice-row">{['Classic','Crystal'].map(v=><button className={detail===v?'choice active':'choice'} onClick={()=>setDetail(v)} key={v}>{v}</button>)}</div>
      <button className="add-button" onClick={()=>{setAdded(true); setTimeout(()=>setAdded(false),1800)}}>{added?'Design saved':'Save your design'} <span>PRICE COMING SOON</span><ArrowRight size={17}/></button>
      <p className="spec-note">Preview only · Final pricing and stone specifications to come</p>
    </div>
    <div className="studio-view"><div className="view-tag"><Sparkles size={14}/> LIVE 3D PREVIEW</div><Canvas camera={{position:[0,0,5.3],fov:38}} shadows dpr={[1,1.6]}><color attach="background" args={['#efdfd1']}/><ambientLight intensity={1.5}/><directionalLight position={[3,4,5]} intensity={2.5} castShadow/><Clip color={color.hex} finish={finish} size={size} detail={detail}/><ContactShadows position={[0,-2,0]} opacity={0.23} scale={5} blur={2.4}/><Environment preset="studio"/><OrbitControls enablePan={false} minDistance={4.4} maxDistance={7} /></Canvas><div className="preview-caption">{size} · {finish} · {color.name}</div><div className="drag-hint">DRAG TO TAKE A LOOK ↗</div><div className="view-counter">01 <span>/</span> 01</div></div>
  </section>
}

function CartPage({items,onRemove}){
  const total=items.reduce((sum,item)=>sum+(Number(item.totalPrice)||0),0);
  return <main className="commerce-page"><div className="commerce-kicker">YOUR LITTLE LINEUP</div><h1>Your bag<span>.</span></h1>{items.length===0?<div className="empty-bag"><p>Your bag is waiting for a little something.</p><a className="commerce-primary" href="#editor">DESIGN YOUR CLIP <ArrowRight size={16}/></a></div>:<div className="commerce-grid"><section className="cart-items">{items.map(item=><article className="cart-item" key={item.cartItemId}><div className="cart-thumb">{item.designPreviewImage?<img src={item.designPreviewImage} alt="3D preview of your custom clip"/>:<span className="cart-clip" style={{'--clip':item.baseColorHex||'#e74365'}}/>}</div><div className="cart-item-copy"><span>CHARMLET CUSTOM CLIP · {item.baseSize||'Small'}</span><h2>{item.name||'Your custom clip'}</h2><p>{item.baseDimensionsMm?.length} × {item.baseDimensionsMm?.width} mm · {item.baseColor||'Cherry'}</p><p>{item.gemstones?.length||0} confirmed gemstones</p><button className="text-action" onClick={()=>onRemove(item.cartItemId)}><Trash2 size={13}/> REMOVE</button></div><b className="cart-line-price">${Number(item.totalPrice||0).toFixed(2)}</b></article>)}</section><aside className="order-summary"><span>ORDER SUMMARY</span><div><span>Items ({items.length})</span><b>${total.toFixed(2)}</b></div><div><span>Shipping & taxes</span><small>Calculated at checkout</small></div><div className="summary-grand"><span>Subtotal</span><b>${total.toFixed(2)}</b></div><a className="commerce-primary" href="#checkout">CONTINUE TO CHECKOUT <ArrowRight size={16}/></a><a className="continue-shopping" href="#editor">Continue designing</a></aside></div>}</main>;
}

function PayPalCheckout({items,onPaid}){
  const containerRef=useRef(null);
  const onPaidRef=useRef(onPaid);
  const [config,setConfig]=useState(null),[status,setStatus]=useState('loading'),[message,setMessage]=useState('');
  useEffect(()=>{onPaidRef.current=onPaid},[onPaid]);
  useEffect(()=>{let active=true;fetch('/api/paypal/config').then(async response=>{if(!response.ok)throw new Error('PayPal setup could not be loaded.');return response.json()}).then(value=>{if(active){setConfig(value);setStatus(value.configured?'loading':'unconfigured')}}).catch(()=>{if(active){setConfig({configured:false});setStatus('error');setMessage('The PayPal payment service is not running. Restart CHARMLET with pnpm dev.')}});return()=>{active=false}},[]);
  useEffect(()=>{
    if(!config?.configured||!containerRef.current)return;
    let cancelled=false;
    const sdkUrl=config.environment==='live'?'https://www.paypal.com/web-sdk/v6/core':'https://www.sandbox.paypal.com/web-sdk/v6/core';
    const loadSdk=()=>new Promise((resolve,reject)=>{
      if(window.paypal){resolve();return}
      let script=document.querySelector('script[data-charmlet-paypal-sdk]');
      if(!script){script=document.createElement('script');script.src=sdkUrl;script.async=true;script.dataset.charmletPaypalSdk='true';document.head.appendChild(script)}
      script.addEventListener('load',resolve,{once:true});
      script.addEventListener('error',()=>reject(new Error('PayPal could not load. Check your internet connection.')),{once:true});
    });
    const showButton=async()=>{
      try{
        await loadSdk();
        if(cancelled)return;
        const sdk=await window.paypal.createInstance({clientId:String(config.clientId||'').trim()，components:['paypal-payments']});
        const eligibility=await sdk.findEligibleMethods();
        if(!eligibility.isEligible('paypal'))throw new Error('PayPal checkout is not available for this account or browser.');
        const button=document.createElement('paypal-button');
        containerRef.current.replaceChildren(button);
        const session=await sdk.createPayPalOneTimePaymentSession({
          onApprove:async data=>{
            try{
              setStatus('processing');setMessage('Confirming your payment securely…');
              const response=await fetch('/api/paypal/orders/'+encodeURIComponent(data.orderId)+'/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
              const result=await response.json();
              if(!response.ok)throw new Error(result.error||'PayPal could not confirm the payment.');
              if(result.status!=='COMPLETED')throw new Error('PayPal has not completed this payment yet.');
              await onPaidRef.current(result);
            }catch(error){setStatus('error');setMessage(error.message||'Payment confirmation failed. Please check your PayPal activity before trying again.')}
          },
          onCancel:()=>{setStatus('ready');setMessage('Payment cancelled. Your bag is unchanged.')},
          onError:error=>{console.error('PayPal checkout error:',error);setStatus('ready');setMessage('PayPal could not complete checkout. Please try again.')},
        });
        button.addEventListener('click',()=>{
          setMessage('');
          const createOrderPromise=(async()=>{
            const designs=items.map(item=>({designId:item.designId,baseSku:item.baseSku,baseSize:item.baseSize,baseDimensionsMm:item.baseDimensionsMm,baseColorHex:item.baseColorHex,gemstones:item.gemstones}));
            const response=await fetch('/api/paypal/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({designs})});
            const result=await response.json();
            if(!response.ok)throw new Error(result.error||'Could not start PayPal checkout.');
            return {orderId:result.id};
          })();
          session.start({presentationMode:'auto'},createOrderPromise).catch(error=>{if(!cancelled){setStatus('ready');setMessage(error.message||'PayPal could not start checkout.')}});
        });
        if(!cancelled)setStatus('ready');
      }catch(error){if(!cancelled){setStatus('error');setMessage(error.message||'PayPal checkout could not load.')}}
    };
    showButton();
    return()=>{cancelled=true;if(containerRef.current)containerRef.current.replaceChildren()};
  },[config,items]);
  if(!config||!config.configured)return <div className="paypal-setup" role="status"><b>{message?'PayPal is not ready':'PayPal Sandbox setup needed'}</b><span>{message||'Create a Sandbox app in PayPal Developer, add its Client ID and Secret to CHARMLET’s local .env.local file, then restart pnpm dev.'}</span><a href="https://developer.paypal.com/dashboard/applications/sandbox" target="_blank" rel="noreferrer">OPEN PAYPAL DEVELOPER DASHBOARD ↗</a></div>;
  return <div className="paypal-checkout-wrap"><div ref={containerRef} className="paypal-button-host" aria-label="PayPal checkout button"/>{status==='loading'&&<p className="paypal-status">Loading secure PayPal checkout…</p>}{status==='processing'&&<p className="paypal-status" role="status">{message}</p>}{status==='error'&&<p className="paypal-status error" role="alert">{message}</p>}{status==='ready'&&message&&<p className="paypal-status" role="status">{message}</p>}<small>{config.environment==='sandbox'?'Sandbox checkout · no real money is taken. ':'PayPal checkout. '}Shipping and tax are not included in this total.</small></div>;
}

function CheckoutPage({items,onOrderComplete}){
  const [method,setMethod]=useState('paypal');
  const [paymentError,setPaymentError]=useState('');
  const total=items.reduce((sum,item)=>sum+(Number(item.totalPrice)||0),0);
  const completePayment=payment=>{
    const order={
      ...payment,
      createdAt:new Date().toISOString(),
      items:items.map(item=>({
        name:item.name||'Your custom clip',
        baseSize:item.baseSize||'Small',
        baseDimensionsMm:item.baseDimensionsMm||null,
        baseColor:item.baseColor||'Cherry pop',
        gemstoneCount:item.gemstones?.length||0,
        totalPrice:Number(item.totalPrice)||0,
      })),
    };
    onOrderComplete(order,items.map(item=>item.cartItemId));
  };
  return <main className="commerce-page checkout-page"><a className="checkout-back" href="#cart">← BACK TO BAG</a><div className="commerce-kicker">ALMOST YOURS</div><h1>Checkout<span>.</span></h1>{items.length===0?<div className="empty-bag"><p>Your bag is empty.</p><a href="#editor">Make a clip</a></div>:<div className="commerce-grid"><section className="checkout-form"><div className="checkout-step"><span>01</span><div><h2>Contact & delivery</h2><p>PayPal will confirm your contact and delivery details in its secure checkout.</p></div></div><div className="checkout-delivery-note">Your design and order total are verified by CHARMLET’s payment server before PayPal opens.</div><div className="checkout-step payment-heading"><span>02</span><div><h2>Payment method</h2><p>Choose how you would like to pay.</p></div></div><div className="payment-options"><button type="button" className={method==='paypal'?'payment-option active':'payment-option'} onClick={()=>{setMethod('paypal');setPaymentError('')}}><span className="radio-dot"/><b className="paypal-word">PayPal</b><small>Secure checkout with PayPal</small></button><button type="button" className="payment-option payment-disabled" disabled><span className="radio-dot"/><CreditCard size={20}/><b>Credit or debit card</b><small>More payment options can be enabled from PayPal after Sandbox checkout is verified.</small></button></div>{method==='paypal'&&<PayPalCheckout items={items} onPaid={completePayment}/ >}{paymentError&&<p className="checkout-feedback" role="alert">{paymentError}</p>}</section><aside className="order-summary"><span>IN YOUR ORDER</span>{items.map((item,index)=><div className="checkout-line" key={item.cartItemId||index}><span>{item.name||'Your custom clip'}<small>{item.gemstones?.length||0} gemstones · {item.baseSize||'Small'}</small></span><b>{'$'}{Number(item.totalPrice||0).toFixed(2)}</b></div>)}<div className="summary-grand"><span>Subtotal</span><b>{'$'}{total.toFixed(2)}</b></div><small className="secure-note">USD · Based on the base clip and confirmed gemstones. Shipping and tax are not included.</small></aside></div>}</main>;
}

function OrderConfirmationPage({order}){
  if(!order)return <main className="commerce-page order-confirmation"><div className="commerce-kicker">YOUR LITTLE LINEUP</div><h1>Order details<span>.</span></h1><div className="empty-bag"><p>No recent order is saved in this browser.</p><a className="commerce-primary" href="#cart">GO TO YOUR BAG <ArrowRight size={16}/></a></div></main>;
  const shipping=order.shipping;
  const address=shipping?.address;
  const addressLines=address?[address.addressLine1,address.addressLine2,[address.city,address.region].filter(Boolean).join(', '),[address.postalCode,address.countryCode].filter(Boolean).join(' ')].filter(Boolean):[];
  return <main className="commerce-page order-confirmation"><div className="commerce-kicker">ORDER CONFIRMED · {order.environment==='sandbox'?'SANDBOX':'PAYPAL'}</div><h1>Thank you<span>.</span></h1><section className="order-confirmation-card"><div className="order-confirmation-status"><CircleCheck size={20}/><span>PAYMENT COMPLETE</span></div><h2>Your order is confirmed.</h2><p>PayPal confirmed {order.environment==='sandbox'?'your Sandbox payment':'your payment'} of <strong>${order.total} USD</strong>.</p><div className="order-information"><article><span>ORDER NUMBER</span><b>{order.id}</b><small>Capture reference · {order.captureId}</small></article><article><span>DELIVERY ADDRESS</span>{shipping&&addressLines.length?<><b>{shipping.name||'Recipient'}</b><address>{addressLines.map((line,index)=><React.Fragment key={index}>{index>0&&<br/>}{line}</React.Fragment>)}</address></>:<p>PayPal did not return a delivery address. Check the address shown in your PayPal receipt.</p>}</article><article><span>DELIVERY STATUS</span><b>Order received</b><small>Tracking details will appear here after shipment information is added.</small></article></div><div className="order-confirmation-items"><span>IN YOUR ORDER</span>{order.items.map((item,index)=><div className="checkout-line" key={index}><span>{item.name}<small>{item.baseSize} · {item.baseDimensionsMm?.length||'—'} × {item.baseDimensionsMm?.width||'—'} mm · {item.gemstoneCount} gemstones · {item.baseColor}</small></span><b>${Number(item.totalPrice||0).toFixed(2)}</b></div>)}</div><a className="commerce-primary order-home-link" href="#top">BACK TO CHARMLET <ArrowRight size={16}/></a></section></main>;
}
function App(){
  const [route,setRoute]=useState(window.location.hash.slice(1)||'top');
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('charmlet-cart')||'[]')}catch{return[]}});
  const [latestOrder,setLatestOrder]=useState(()=>{try{return JSON.parse(localStorage.getItem('charmlet-latest-order')||'null')}catch{return null}});
  const [toast,setToast]=useState('');
  const cartCount=cart.length;
  useEffect(()=>{const sync=()=>setRoute(window.location.hash.slice(1)||'top');window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);
  const addToCart=data=>{const item={...data,cartItemId:globalThis.crypto?.randomUUID?.()??String(Date.now())};const next=[...cart,item];localStorage.setItem('charmlet-cart',JSON.stringify(next));setCart(next);setToast('Added to your bag');window.setTimeout(()=>setToast(''),5000)};
  const removeFromCart=id=>{const next=cart.filter(item=>item.cartItemId!==id);localStorage.setItem('charmlet-cart',JSON.stringify(next));setCart(next)};
  return <><div className="announcement">A little color goes a long way <span>✳</span> A little color goes a long way <span>✳</span></div><header><button className="icon-button mobile-menu" aria-label="Open menu"><Menu/></button><nav><a href="#shop">THE COLLECTION</a><a href="#about">OUR LITTLE WORLD</a>{latestOrder&&<a href="#order-confirmation">MY ORDER</a>}</nav><a href="#top" className="wordmark">CHARMLET<span>®</span></a><div className="nav-right"><a href="#editor">DESIGN YOURS <ArrowUpRight size={14}/></a><button className="bag" aria-label={`Open shopping bag with ${cartCount} items`} onClick={()=>{setToast('');window.location.hash='#cart'}}><ShoppingBag size={18}/><small>{cartCount}</small></button></div></header>
  {route==='editor'?<DIYStudio onAddToCart={addToCart}/>:route==='cart'?<CartPage items={cart} onRemove={removeFromCart}/>:route==='checkout'?<CheckoutPage items={cart} onOrderComplete={(order,ids)=>{const paidIds=new Set(ids);const next=cart.filter(item=>!paidIds.has(item.cartItemId));localStorage.setItem('charmlet-cart',JSON.stringify(next));localStorage.setItem('charmlet-latest-order',JSON.stringify(order));setLatestOrder(order);setCart(next);window.location.hash='#order-confirmation'}}/>:route==='order-confirmation'?<OrderConfirmationPage order={latestOrder}/>:<main id="top"><section className="hero"><div className="hero-top"><span>GOOD HAIR DAYS, BY DESIGN</span><span>MADE FOR YOUR MOOD&nbsp; ✳ &nbsp;EST. EVERY DAY</span></div><h1>Make it<br/><em>your kind</em><span className="period">.</span></h1><div className="hero-bottom"><p>Small clip, big main character energy.<br/>Meet your new everyday favorite.</p><a href="#shop" className="circle-link">MEET<br/>CHARMLET <ArrowDown size={16}/></a><div className="hero-sticker">A LITTLE<br/>JOY, ON<br/>REPEAT <span>✳</span></div></div><div className="hero-art"><img src="/images/charmlet-hero-girl-clip.png" alt="Young woman wearing a colorful jeweled plastic hair clip" onError={event=>{event.currentTarget.style.display="none"}}/></div><div className="hero-caption">THE CLIP THAT GETS YOU <span>↗</span></div></section>
  <div className="ticker"><div>COLOR OUTSIDE THE LINES <span>✳</span> YOUR HAIR, YOUR RULES <span>✳</span> LITTLE THINGS, BIG FEELING <span>✳</span> COLOR OUTSIDE THE LINES <span>✳</span></div></div><Collection/><section className="manifesto" id="about"><span>THE CHARMLET MOOD</span><p>Getting dressed is fun.<br/>Your hair should be, <i>too.</i></p><a href="#editor">COME PLAY <ArrowRight size={15}/></a><span className="manifesto-star">✳</span></section></main>}<footer><a className="wordmark" href="#top">CHARMLET<span>®</span></a><span>GOOD HAIR DAYS START HERE.</span><span>© CHARMLET 2026</span></footer>{toast&&<div className="cart-toast" role="status"><CircleCheck size={18}/><span>{toast}</span><a href="#cart" onClick={()=>setToast('')}>VIEW BAG <ArrowRight size={13}/></a><button aria-label="Dismiss" onClick={()=>setToast('')}>×</button></div>}</>}

createRoot(document.getElementById('root')).render(<App/>);
