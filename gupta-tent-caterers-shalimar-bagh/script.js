(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var NS='http://www.w3.org/2000/svg';
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}

/* bunting */
var bun=$('.bunting');
if(bun){for(var i=0;i<22;i++){var f=document.createElement('i');f.style.animationDelay=(-i*0.37)+'s';bun.appendChild(f)}}

/* reveal */
var rv=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
  rv.forEach(function(n){io.observe(n)});
}else rv.forEach(function(n){n.classList.add('in')});

/* planner */
var BAY=160,MAXB=6,CX=600,GY=300,MAXDOTS=60;
var state={fn:'Wedding',guests:240,cat:'Yes',floors:3};
var LINES={'Haldi':'Marigold backdrop and floor seating','Mehndi':'Low seating, lanterns, mehndi corner','Cocktail':'High tables and fairy-light ceiling','Wedding':'Stage, entry gate and lighting','House decoration':'Drapes and lights for your building front'};
var tentG=$('#tentG'),tablesG=$('#tables'),houseG=$('#houseG');
var bays=[],dots=[],floors=[];
for(var b=0;b<MAXB;b++){
  var g=el('g',{'class':'bay'},tentG);
  var cl=el('g',{'clip-path':'url(#roofclip)'},g);
  for(var k=0;k<4;k++){el('rect',{x:k*40,y:60,width:40,height:54,'class':k%2?'st2':'st1'},cl)}
  el('polygon',{points:'0,112 80,62 160,112','class':'roof'},g);
  for(k=0;k<4;k++){
    el('rect',{x:k*40,y:112,width:40,height:20,'class':k%2?'st2':'st1'},g);
    el('path',{d:'M'+(k*40)+',132 a20,20 0 0 0 40,0z','class':k%2?'st2':'st1'},g);
  }
  el('rect',{x:-3,y:112,width:6,height:GY-112,'class':'pole'},g);
  el('rect',{x:BAY-3,y:112,width:6,height:GY-112,'class':'pole'},g);
  bays.push(g);
}
for(var d=0;d<MAXDOTS;d++){dots.push(el('circle',{r:9,cx:0,cy:0,'class':'tb'},tablesG))}
for(var fl=0;fl<6;fl++){
  var h=el('g',{'class':'fl'},houseG);
  var y=GY-(fl+1)*46;
  el('rect',{x:CX-120,y:y,width:240,height:46,'class':'body'},h);
  [0,1,2].forEach(function(j){el('rect',{x:CX-120+14+j*86,y:y+3,width:14,height:40,'class':'dr'},h)});
  [0,1].forEach(function(j){el('rect',{x:CX-70+j*100,y:y+12,width:20,height:22,'class':'win'},h)});
  floors.push(h);
}

function plan(){
  var house=state.fn==='House decoration';
  var n=state.guests,B=Math.min(MAXB,Math.max(1,Math.ceil(n/100)));
  var tables=Math.ceil(n/8);
  tentG.style.display=tablesG.style.display=house?'none':'';
  houseG.style.display=house?'':'none';
  // bays
  var total=B*BAY,x0=CX-total/2;
  bays.forEach(function(g,i){
    var on=i<B&&!house;
    g.style.opacity=on?1:0;
    g.style.transform=on?'translate('+(x0+i*BAY)+'px,0)':'translate('+CX+'px,0) scale(0,1)';
  });
  // tables
  var nd=Math.min(MAXDOTS,tables),cols=4*B,rows=Math.ceil(nd/cols),idx=0;
  dots.forEach(function(c){c.style.opacity=0;c.style.transform='translate('+CX+'px,230px) scale(0)'});
  for(var r=0;r<rows;r++){
    var inRow=Math.min(cols,nd-idx),off=Math.floor((cols-inRow)/2);
    for(var c=0;c<inRow;c++){
      var dot=dots[idx++],s=off+c;
      dot.style.opacity=house?0:1;
      dot.style.transform='translate('+(x0+Math.floor(s/4)*BAY+20+(s%4)*40)+'px,'+(190+r*32)+'px) scale(1)';
    }
  }
  // house floors
  floors.forEach(function(f,i){var on=house&&i<state.floors;f.style.opacity=on?1:0;f.style.transform=on?'none':'translateY(-30px)'});
  // UI
  $('#gOut').textContent=n;
  $('#fOut').textContent=state.floors;
  $('#guestStep').hidden=house;$('#floorStep').hidden=!house;$('#catStep').hidden=house;
  document.querySelectorAll('[data-fn]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.fn===state.fn)});
  document.querySelectorAll('[data-cat]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.cat===state.cat)});
  var L=[];
  if(house){L.push('Floors to cover: '+state.floors)}
  else{
    L.push('About '+tables+' tables of 8');
    L.push('Tent: '+B+' bays');
    if(state.cat==='Yes'){L.push('Buffet counters: '+Math.ceil(n/75));L.push('Serving staff: '+Math.ceil(n/25))}
  }
  L.push(LINES[state.fn]);
  var ul=$('#res');ul.innerHTML='';
  L.forEach(function(t,i){var li=document.createElement('li');li.textContent=t;if(i===L.length-1)li.className='fn';li.style.animationDelay=(i*50)+'ms';ul.appendChild(li)});
  // whatsapp
  var date=$('#date').value||'to be decided',venue=$('#venue').value.trim()||'to be decided';
  var msg=house
    ?'Hi, I\'d like a rough quote for a House decoration. Floors: '+state.floors+'. Date: '+date+'. Venue: '+venue+'.'
    :'Hi, I\'d like a rough quote for a '+state.fn+'. Guests: '+n+'. Catering: '+state.cat+'. Tent: '+B+' bays. Date: '+date+'. Venue: '+venue+'.';
  $('#send').href='https://wa.me/919718885572?text='+encodeURIComponent(msg);
}

document.querySelectorAll('[data-fn]').forEach(function(b){b.addEventListener('click',function(){
  state.fn=b.dataset.fn;if(b.dataset.g){state.guests=+b.dataset.g;$('#guests').value=state.guests}plan()})});
document.querySelectorAll('[data-cat]').forEach(function(b){b.addEventListener('click',function(){state.cat=b.dataset.cat;plan()})});
$('#guests').addEventListener('input',function(e){state.guests=+e.target.value;plan()});
$('#fMinus').addEventListener('click',function(){state.floors=Math.max(1,state.floors-1);plan()});
$('#fPlus').addEventListener('click',function(){state.floors=Math.min(6,state.floors+1);plan()});
$('#date').addEventListener('input',plan);
$('#venue').addEventListener('input',plan);
plan();
})();
