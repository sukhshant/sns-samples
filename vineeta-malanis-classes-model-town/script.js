(function(){
  var d=document, root=d.documentElement;
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* reveal on scroll */
  var rev=[].slice.call(d.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});
    rev.forEach(function(el){io.observe(el);});
  }else{rev.forEach(function(el){el.classList.add('in');});}

  /* today's row */
  var day=new Date().getDay();
  var row=d.querySelector('.hours tr[data-d="'+day+'"]');
  if(row)row.classList.add('today');

  /* the red pen */
  var words=[].slice.call(d.querySelectorAll('#pen .w'));
  var hint=d.getElementById('hint'), done=d.getElementById('done'), live=d.getElementById('live');
  var fixedCount=0;

  function svg(tag,attrs){var n=d.createElementNS(NS,tag);for(var k in attrs)n.setAttribute(k,attrs[k]);return n;}

  words.forEach(function(w){
    var wrong=w.getAttribute('data-wrong'), right=w.getAttribute('data-right');
    var b=d.createElement('button');
    b.type='button'; b.className='w-btn';
    b.setAttribute('aria-label','Mistake: '+wrong+'. Tap to correct.');
    var txt=d.createElement('span'); txt.className='txt'; txt.textContent=wrong;
    var s=svg('svg',{'class':'strike',viewBox:'0 0 100 20',preserveAspectRatio:'none','aria-hidden':'true'});
    s.appendChild(svg('path',{pathLength:'1',d:'M0 13 C 22 5, 58 18, 100 6'}));
    var fix=d.createElement('span'); fix.className='fix'; fix.setAttribute('aria-hidden','true');
    fix.appendChild(d.createTextNode(right));
    var tick=svg('svg',{viewBox:'0 0 30 30'}); tick.appendChild(svg('path',{d:'M3 16 L 11 25 L 27 5'}));
    fix.appendChild(tick);
    b.appendChild(fix); b.appendChild(txt); b.appendChild(s);
    w.parentNode.replaceChild(b,w);
    b.addEventListener('click',function(){
      if(b.classList.contains('fixed'))return;
      b.classList.add('fixed');
      b.setAttribute('aria-label','Corrected: '+wrong+' becomes '+right);
      b.setAttribute('aria-disabled','true');
      if(live)live.textContent=wrong+' is now '+right+'.';
      fixedCount++;
      if(fixedCount===words.length){
        if(hint)hint.style.opacity='0';
        setTimeout(function(){
          done.hidden=false;
          if(live)live.textContent='Well done!';
        },reduce?0:700);
      }
    });
  });
})();
