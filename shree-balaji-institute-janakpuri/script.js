(function(){
var io=null,els=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(el){io.observe(el)})}else els.forEach(function(el){el.classList.add('in')});
var send=document.getElementById('send'),pills=[].slice.call(document.querySelectorAll('.pill'));
pills.forEach(function(p){p.addEventListener('click',function(){
  pills.forEach(function(q){q.classList.remove('on');q.setAttribute('aria-checked','false')});
  p.classList.add('on');p.setAttribute('aria-checked','true');
  send.href='https://wa.me/919999888952?text='+encodeURIComponent('Hi sir, I have a doubt in '+p.textContent+'. Can you help?');
})});
})();
