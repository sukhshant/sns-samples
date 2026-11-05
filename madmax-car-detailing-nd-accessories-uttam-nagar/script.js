(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  // reveal
  var rv=$$('.rv');
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
    rv.forEach(function(el){io.observe(el)});
  } else rv.forEach(function(el){el.classList.add('in')});

  // active nav
  var links=$$('.bar nav a');
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-40% 0px -55% 0px'});
    links.forEach(function(a){var t=$(a.getAttribute('href'));if(t)so.observe(t)});
  }

  // planner
  var scale={Hatchback:'scale(.8,.92)',Sedan:'scale(1,.92)',SUV:'scale(1.08,1.12)'};
  var names={foam:'Foam wash',interior:'Interior detailing',ceramic:'Ceramic coating',ppf:'PPF',mats:'Footmats and accessories'};
  var state={size:'Sedan',svc:[]};
  var car=$('#car'),leds=$$('.led'),model=$('#model'),day=$('#day'),sum=$('#sum'),cta=$('#cta'),hint=$('#hint');
  car.style.transform=scale.Sedan;

  $$('[data-size]').forEach(function(b){b.addEventListener('click',function(){
    state.size=b.dataset.size;
    $$('[data-size]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    car.style.transform=scale[state.size];
    update();
  })});
  $$('[data-svc]').forEach(function(b){b.addEventListener('click',function(){
    var k=b.dataset.svc,i=state.svc.indexOf(k),on=i<0;
    if(on)state.svc.push(k);else state.svc.splice(i,1);
    b.setAttribute('aria-pressed',on);
    var z=$('[data-z="'+k+'"]');
    if(z){
      if(k==='ceramic'&&on&&!reduce){z.classList.remove('on');void z.getBoundingClientRect();}
      z.classList.toggle('on',on);
    }
    update();
  })});
  model.addEventListener('input',update);day.addEventListener('change',update);

  function order(){return Object.keys(names).filter(function(k){return state.svc.indexOf(k)>-1}).map(function(k){return names[k]})}
  function update(){
    var n=state.svc.length,list=order(),m=model.value.trim(),d=day.value;
    leds.forEach(function(l,i){l.classList.toggle('on',n>i)});
    var parts=[state.size+(n?', '+list.join(' + '):'')+'.'];
    if(!n){parts=[state.size+'.'];}
    if(m)parts.push('Car: '+m+'.');
    if(d)parts.push('Day: '+d+'.');
    sum.textContent=parts.join(' ');
    var msg="Hi Madmax, I'd like a rough quote."+(m?' Car: '+m+'.':'')+' Size: '+state.size+'.'+(n?' Services: '+list.join(', ')+'.':'')+(d?' Preferred day: '+d+'.':'');
    cta.href='https://wa.me/919212166144?text='+encodeURIComponent(msg);
    cta.setAttribute('aria-disabled',n?'false':'true');
    hint.hidden=!!n;
  }
  cta.addEventListener('click',function(e){if(!state.svc.length){e.preventDefault();hint.hidden=false}});
  update();
})();
