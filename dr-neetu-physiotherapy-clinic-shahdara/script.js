function fb(img){var d=document.createElement('div');d.className='fb';d.textContent='Dr Neetu Physiotherapy clinic';img.replaceWith(d)}
(function(){
var $=function(s,r){return(r||document).querySelector(s)};
// fade-up
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.fade').forEach(function(el){io.observe(el)});
// today row
var d=new Date().getDay(),rows=document.querySelectorAll('.hours tr');
if(rows.length)rows[(d+6)%7].classList.add('today');

// Wow 1: visit planner
var Q={'neck pain':['Drivesh Singh','Had a great experience with Dr. Neetu. I visited her for neck pain and got significant relief in just one session.'],
'shoulder stiffness (frozen shoulder)':['Mohd Usman','I had frozen shoulder and was struggling with pain and stiffness. Thanks to doctor Neetu\'s physiotherapy treatment and guidance, I regained shoulder movement and experienced significant pain relief.'],
'back pain':['Khushi Yadav','She carefully assessed my condition, explained the treatment plan clearly, and helped me recover from chronic back pain.'],
'general body pain':['Khushi','In just 13 days I\'ve felt so much relief from my pain. Had good experience with her. Really gonna recommend to everyone who\'s dealing with body pain.']};
var S={},book=$('#book'),help=$('#help'),prev=$('#preview');
document.querySelectorAll('.opts').forEach(function(g){
 g.addEventListener('click',function(e){var b=e.target.closest('.opt');if(!b||b.disabled)return;
  g.querySelectorAll('.opt').forEach(function(o){o.setAttribute('aria-pressed',o===b)});
  S[g.dataset.k]=b.dataset.v;update(g.dataset.k==='concern')})});
function update(showQ){
 if(showQ){var q=Q[S.concern],r=$('#result');$('.empty',r).hidden=true;var det=$('.detail',r);det.hidden=false;
  det.style.animation='none';det.offsetWidth;det.style.animation='';
  $('#pq').hidden=!q;if(q){$('#pq p').textContent='“'+q[1]+'”';$('#pq cite').textContent=q[0]+', on Google Maps'}
  det.querySelectorAll('.steps li').forEach(function(l){l.style.animation='none';l.offsetWidth;l.style.animation=''})}
 var ok=S.concern&&S.time&&S.day;
 if(ok){var m='Hi Dr. Neetu, I have '+S.concern+'. I\'d like to come on '+S.day+' in the '+S.time+'. Is a slot free?';
  book.href='https://wa.me/918810546475?text='+encodeURIComponent(m);book.setAttribute('aria-disabled','false');
  prev.hidden=false;prev.textContent=m;help.hidden=true}
 else{book.href='#';book.setAttribute('aria-disabled','true');prev.hidden=true;help.hidden=false}}

// Wow 2: review explorer
var R=[
['Khushi','4 months ago','I was searching for a good female therapist until I found Dr Neetu physiotherapy clinic. In just 13 days I\'ve felt so much relief from my pain . Had good experience with her.especially, in session timings she understood my problems and managed it well. Really gonna recommend to everyone who\'s dealing with body pain.'],
['Drivesh Singh','4 weeks ago','Had a great experience with Dr. Neetu. I visited her for neck pain and got significant relief in just one session. She explained everything very clearly and patiently, and her nature is very friendly and caring. Highly recommended!'],
['Raj Singh','2 months ago','Excellent physiotherapy experience with Dr. Neetu Singh. She is highly professional, caring, and explains every exercise and treatment clearly. I noticed a great improvement in my condition. Highly recommended for anyone looking for effective and personalized physiotherapy care.'],
['Mohd Usman','4 months ago','I had frozen shoulder and was struggling with pain and stiffness. Thanks to doctor Neetu\'s physiotherapy treatment and guidance, I regained shoulder movement and experienced significant pain relief. Her supportive approach and effective exercises made my recovery smooth and successful. Highly recommended.'],
['Khushi Yadav','3 months ago','Hi, I\'m khushi " Dr. Neetu Singh is an excellent physiotherapist. She carefully assessed my condition, explained the treatment plan clearly, and helped me recover from chronic back pain. Her expertise and caring approach made a huge difference. Highly recommend."']];
var K={'Pain relief':['relief','pain'],'Explains clearly':['explain'],'Caring':['caring','friendly','supportive'],'Neck':['neck'],'Shoulder':['shoulder'],'Back':['back']};
function re(k){return new RegExp('('+(k?K[k]:[].concat.apply([],Object.values(K))).join('|')+')\\w*','gi')}
function has(t,k){return re(k).test(t)}
var cur='All',fl=$('#filters'),cards=$('#cards');
function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function render(){
 fl.innerHTML='';
 ['All'].concat(Object.keys(K)).forEach(function(k){
  var n=k==='All'?R.length:R.filter(function(r){return has(r[2],k)}).length;if(!n)return;
  var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',k===cur);
  b.innerHTML=k+'<small>'+n+'</small>';b.onclick=function(){cur=k;render()};fl.appendChild(b)});
 cards.innerHTML='';
 R.forEach(function(r,i){if(cur!=='All'&&!has(r[2],cur))return;
  var t=esc(r[2]);if(cur!=='All')t=t.replace(re(cur),'<mark>$&</mark>');
  var c=document.createElement('article');c.className='card';c.style.animationDelay=(i*.04)+'s';
  c.innerHTML='<div class="stars" aria-label="5 stars">★★★★★</div><p>“'+t+'”</p><b>'+r[0]+'</b><small>on Google Maps, '+r[1]+'</small>';
  cards.appendChild(c)})}
render();
$('[data-k=concern] .opt').click();
})();
