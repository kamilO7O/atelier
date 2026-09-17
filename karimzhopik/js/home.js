/*
  Каталог намеренно собран из одного массива.
  Следующим этапом этот источник данных можно заменить на Supabase:
  товары, цены, описания и URL изображений будут приходить из БД/Storage.
*/
const PRODUCTS = [
  {id:1,name:"VINCENT",category:"Диваны",price:189000,image:"https://mbb.ru/upload/iblock/32f/00898u4a79fr6f8lycwrec2nj1kntn4x.jpg",description:"Глубокий мягкий диван с выразительными подлокотниками."},
  {id:2,name:"VANCOUVER",category:"Диваны",price:214000,image:"https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=95",description:"Модульная система с несколькими вариантами конфигурации."},
  {id:3,name:"BERNADETTE",category:"Диваны",price:239000,image:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=95",description:"Объёмный диван с низкой посадкой и мягкими подушками."},
  {id:4,name:"AURELIA",category:"Кресла",price:79000,image:"https://mbb.ru/upload/iblock/4aa/rvcmxsx7i5w9ixdezi0mn9as2s7a6h49.jpg",description:"Акцентное кресло с выразительным силуэтом."},
  {id:5,name:"LUNA",category:"Кресла",price:68000,image:"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=95",description:"Компактное мягкое кресло для зоны отдыха."},
  {id:6,name:"DEO",category:"Кровати",price:169000,image:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=95",description:"Кровать с мягким изголовьем и спокойной геометрией."},
  {id:7,name:"MONO",category:"Кровати",price:152000,image:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=95",description:"Лаконичная кровать с мягкой рамой."},
  {id:8,name:"MUSE",category:"Столы",price:92000,image:"https://images.unsplash.com/photo-1532372320572-cda25653a694?auto=format&fit=crop&w=1200&q=95",description:"Журнальный стол с натуральной фактурой."}
];

let category="Все";
let cart=JSON.parse(localStorage.getItem("atelier_cart")||"[]");

const money=n=>new Intl.NumberFormat("ru-RU").format(n)+" ₽";

function renderCart(){
  const list=document.getElementById("cartList");
  const total=document.getElementById("total");
  if(!cart.length){
    list.innerHTML='<div style="padding:40px 5px;text-align:center;color:var(--muted);font-size:11px">Корзина пока пуста</div>';
    total.textContent=money(0);
    const headerCount=document.getElementById("headerCartCount");
    if(headerCount) headerCount.textContent="0";
    return;
  }
  let sum=0;
  list.innerHTML=cart.map(i=>{
    const p=PRODUCTS.find(x=>x.id===i.id);
    sum+=p.price*i.qty;
    return `<div class="cart-row">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <strong>${p.name}</strong>
        <small>${money(p.price)}</small>
        <div class="cart-actions">
          <button data-minus="${p.id}">−</button><span style="font-size:10px;padding:5px">${i.qty}</span><button data-plus="${p.id}">+</button>
        </div>
      </div>
      <button class="cart-remove" data-remove="${p.id}">Удалить</button>
    </div>`;
  }).join("");
  total.textContent=money(sum);
  const count=cart.reduce((s,x)=>s+x.qty,0);
  const headerCount=document.getElementById("headerCartCount");
  if(headerCount) headerCount.textContent=count;
}

function add(id){
  const item=cart.find(x=>x.id===id);
  if(item)item.qty++;
  else cart.push({id,qty:1});
  localStorage.setItem("atelier_cart",JSON.stringify(cart));
  renderCart();
  toast("Товар добавлен в корзину");
}

function toast(text){
  const t=document.getElementById("toast");
  t.textContent=text;t.classList.add("show");
  clearTimeout(window.tt);
  window.tt=setTimeout(()=>t.classList.remove("show"),2000);
}

document.addEventListener("click",e=>{
  const addBtn=e.target.closest("[data-add]");
  if(addBtn)add(Number(addBtn.dataset.add));

  const plus=e.target.closest("[data-plus]");
  if(plus){
    const item=cart.find(x=>x.id===Number(plus.dataset.plus));item.qty++;
    localStorage.setItem("atelier_cart",JSON.stringify(cart));renderCart();
  }
  const minus=e.target.closest("[data-minus]");
  if(minus){
    const item=cart.find(x=>x.id===Number(minus.dataset.minus));
    item.qty--;
    if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);
    localStorage.setItem("atelier_cart",JSON.stringify(cart));renderCart();
  }
  const remove=e.target.closest("[data-remove]");
  if(remove){
    cart=cart.filter(x=>x.id!==Number(remove.dataset.remove));
    localStorage.setItem("atelier_cart",JSON.stringify(cart));renderCart();
  }
});

const modal=document.getElementById("modal");
const openProject=()=>{
  modal.classList.add("open");
  document.body.style.overflow="hidden";
};
const closeProject=()=>{
  modal.classList.remove("open");
  document.body.style.overflow="";
};
document.querySelectorAll("[data-project-open]").forEach(link=>link.addEventListener("click",e=>{
  e.preventDefault();
  openProject();
}));
document.getElementById("closeModal").onclick=closeProject;
modal.addEventListener("click",e=>{if(e.target===modal)closeProject()});

document.getElementById("form").addEventListener("submit",e=>{
  e.preventDefault();
  e.target.reset();
  closeProject();
  toast("Заявка отправлена");
});

const cartBox=document.getElementById("cart");
document.getElementById("closeCart").onclick=()=>cartBox.classList.remove("open");

document.getElementById("checkout").onclick=()=>{
  if(!cart.length){toast("Корзина пуста");return}
  cartBox.classList.remove("open");
  openProject();
};

document.getElementById("menuBtn").onclick=()=>{
  document.querySelector(".nav").style.display="flex";
  document.querySelector(".nav").style.position="fixed";
  document.querySelector(".nav").style.inset="70px 18px auto";
  document.querySelector(".nav").style.background="rgba(39,35,30,.96)";
  document.querySelector(".nav").style.padding="20px";
  document.querySelector(".nav").style.flexDirection="column";
  document.querySelector(".nav").style.zIndex="200";
  document.querySelector(".nav").style.color="#fff";
};

document.getElementById("headerCart").onclick=()=>document.getElementById("cart").classList.add("open");

document.getElementById("headerMenu").onclick=()=>{
  document.getElementById("mobileNav").classList.toggle("open");
  document.getElementById("headerMenu").classList.toggle("active");
};

document.querySelectorAll(".mobile-nav a").forEach(a=>a.addEventListener("click",()=>{
  document.getElementById("mobileNav").classList.remove("open");
  document.getElementById("headerMenu").classList.remove("active");
}));

window.addEventListener("scroll",()=>{
  document.getElementById("realHeader").classList.toggle("shadow",window.scrollY>5);
});

renderCart();
if(location.hash==="#modal") openProject();
