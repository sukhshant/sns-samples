(function(){
var io=null,els=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(el){io.observe(el)})}else els.forEach(function(el){el.classList.add('in')});
try{
var board=document.getElementById('doubtBoard'),cv=document.getElementById('cv'),ctx=cv.getContext('2d');
board.hidden=false;
var hint=document.getElementById('hint'),send=document.getElementById('send'),clear=document.getElementById('clear'),pills=[].slice.call(document.querySelectorAll('.pill'));
var subject='Maths',drawing=false,pts=[],started=false,dpr=1,w=0,h=0;
function size(){var r=cv.getBoundingClientRect();dpr=window.devicePixelRatio||1;w=r.width;h=r.height;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);style()}
function style(){ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#E5482B'}
function pos(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function link(){send.href='https://wa.me/919999888952?text='+encodeURIComponent('Hi sir, I have a doubt in '+subject+' (Class __). Can you help?')}
cv.addEventListener('pointerdown',function(e){e.preventDefault();cv.setPointerCapture(e.pointerId);drawing=true;var p=pos(e);pts=[p];ctx.beginPath();ctx.arc(p.x,p.y,2,0,6.3);ctx.fillStyle='#E5482B';ctx.fill();
if(!started){started=true;hint.classList.add('gone');send.classList.add('ready')}});
cv.addEventListener('pointermove',function(e){if(!drawing)return;e.preventDefault();var p=pos(e),l=pts[pts.length-1];pts.push(p);if(pts.length<3){ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(p.x,p.y);ctx.stroke();return}
var a=pts[pts.length-3],b=l,mx=(b.x+p.x)/2,my=(b.y+p.y)/2,sx=(a.x+b.x)/2,sy=(a.y+b.y)/2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(b.x,b.y,mx,my);ctx.stroke()});
['pointerup','pointercancel','pointerleave'].forEach(function(t){cv.addEventListener(t,function(){drawing=false;pts=[]})});
clear.addEventListener('click',function(){cv.classList.add('wipe');setTimeout(function(){ctx.clearRect(0,0,w,h);cv.classList.remove('wipe')},350)});
pills.forEach(function(p){p.addEventListener('click',function(){pills.forEach(function(q){q.classList.remove('on');q.setAttribute('aria-checked','false')});p.classList.add('on');p.setAttribute('aria-checked','true');subject=p.textContent;link();p.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'})})});
link();size();window.addEventListener('resize',function(){if(Math.abs(cv.getBoundingClientRect().width-w)>1)size()});
}catch(err){var b=document.getElementById('doubtBoard');if(b)b.hidden=true;var a=document.createElement('a');a.className='btn btn-fill';a.href='https://wa.me/919999888952';a.textContent='WhatsApp us';document.getElementById('board').appendChild(a)}
})();
