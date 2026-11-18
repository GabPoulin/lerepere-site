// Formulaire de soumission du Repère
(function(){
  var f=document.getElementById('formulaire'),st=document.getElementById('statut'),btn=f.querySelector('button');
  var cb=document.getElementById('est-entreprise'),ch=document.getElementById('champ-entreprise'),ent=ch.querySelector('input'),lib=document.getElementById('libelle-nom');
  function maj(){var on=cb.checked;ch.hidden=!on;ent.disabled=!on;ent.required=on;lib.textContent=on?'Prénom et nom du contact':'Prénom et nom';if(!on)ent.value='';}
  cb.addEventListener('change',maj);
  var de=document.getElementById('date-evenement'),d=new Date();d.setDate(d.getDate()+7);
  function iso(x){return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
  var min=iso(d);
  de.min=min;
  // Date par défaut : le premier samedi qui respecte le délai de 7 jours
  var sam=new Date(d);while(sam.getDay()!==6)sam.setDate(sam.getDate()+1);
  de.defaultValue=iso(sam);de.value=iso(sam);
  var aide=document.getElementById('aide-date');
  function verif(){var bad=!!(de.value&&de.value<min);de.setCustomValidity(bad?'Choisissez une date au moins 7 jours à l\u2019avance. Pour un besoin urgent, contactez-nous par texto ou appel.':'');de.classList.toggle('invalide',bad);aide.classList.toggle('alerte',bad)}
  de.addEventListener('input',verif);de.addEventListener('change',verif);

  // Prix selon le forfait et la durée (prix 2026-2027) : modifier ici au besoin
  var PRIX={
    // base = 1 jour · j2 = 2 jours · sem = 3 à 7 jours. Durée absente = sur soumission (plus de 7 jours : toujours sur soumission)
    dj:  {nom:'DJ / party',base:[395,'/ événement'],j2:[465,'fin de semaine, 2 jours'],sem:[600,'semaine, 3 à 7 jours']},
    conf:{nom:'Conférence / corporatif',base:[665,'/ événement'],j2:[1130,'2 jours']},
    trio:{nom:'Spectacle trio musical',base:[1150,'/ événement']},
    perso:{nom:'Forfait personnalisé'}
  };
  var du=document.getElementById('duree'),est=document.getElementById('estimation'),pa=document.getElementById('prix-affiche');
  function m(n){return n.toLocaleString('fr-CA')+' $'}
  function opt(){return du.options[du.selectedIndex]||{dataset:{}}}
  var au=document.getElementById('audience'),aideAu=document.getElementById('aide-audience');
  function grosse(){var o=au.options[au.selectedIndex];return !!(o&&o.dataset.grosse)}
  var chEst=document.getElementById('champ-estimation'),auEst=document.getElementById('audience-estimee');
  function majAudience(){var g=grosse();aideAu.hidden=!g;aideAu.classList.toggle('alerte',g);au.classList.toggle('attention',g);
    chEst.hidden=!g;auEst.disabled=!g;auEst.required=g;if(!g){auEst.value='';marquer(auEst,false)}}
  au.addEventListener('change',majAudience);
  var ext=document.getElementById('exterieur'),aideExt=document.getElementById('aide-exterieur');
  function majExt(){aideExt.hidden=!ext.checked}
  ext.addEventListener('change',majExt);
  function prix(cle){var p=PRIX[cle],c=opt().dataset.p||'base';if(grosse())return null;return p&&p[c]?{v:p[c][0],u:p[c][1],dep:false}:null}
  function majPrix(){
    f.querySelectorAll('input[name=Forfait]').forEach(function(r){
      var x=prix(r.dataset.cle),el=r.parentNode.querySelector('.px');
      if(el)el.innerHTML=x?m(x.v)+(x.u.charAt(0)==='/'?'':' <em class="u">'+x.u+'</em>'):'Sur soumission';
    });
    var r=f.querySelector('input[name=Forfait]:checked');
    if(!r){est.hidden=true;pa.value='';return}
    var x=prix(r.dataset.cle),nom=PRIX[r.dataset.cle].nom;
    est.hidden=false;
    if(x){
      est.innerHTML='Prix estimé : '+(x.dep?'à partir de ':'')+'<b class="m">'+m(x.v)+'</b> '+(x.u.charAt(0)==='/'?x.u:'('+x.u+')')+'<small>'+nom+' · tout inclus, aucune taxe · prix 2026-2027. Le prix final est confirmé dans votre soumission.</small>';
      pa.value=(x.dep?'À partir de ':'')+m(x.v)+' ('+(x.u.charAt(0)==='/'?'1 événement':x.u)+') · '+nom+' · prix 2026-2027';
    }else{
      var raison=grosse()?'audience de plus de 150 personnes':'';
      est.innerHTML='Prix estimé : <b class="m">sur soumission</b><small>'+nom+(raison?' · '+raison:'')+' · on vous prépare un prix selon vos besoins.</small>';
      pa.value='Sur soumission · '+nom+(raison?' ('+raison+')':'');
    }
  }
  // Durées offertes selon le forfait (la dernière option est toujours sur soumission)
  var DUREES={
    // [libellé, catégorie de prix, nombre de jours minimum]
    tous:[['1 journée','base',1],['2 jours','j2',2],['3 à 7 jours','sem',3],['Plus de 7 jours','plus',8]],
    conf:[['1 journée','base',1],['2 jours','j2',2],['3 jours et plus','plus',3]],
    trio:[['1 journée','base',1],['2 jours et plus','plus',2]]
  };
  function majDurees(){
    var r=f.querySelector('input[name=Forfait]:checked'),liste=DUREES[r&&r.dataset.cle]||DUREES.tous;
    var j=+(opt().dataset.j||1),choix=liste[0];
    liste.forEach(function(x){if(x[2]<=j)choix=x});
    while(du.options.length>1)du.remove(1);
    liste.forEach(function(x){var o=new Option(x[0],x[0]);o.dataset.p=x[1];o.dataset.j=x[2];if(x===choix)o.selected=true;du.add(o)});
  }
  f.addEventListener('change',function(e){if(e.target.name==='Forfait')majDurees()});
  f.addEventListener('change',majPrix);
  majPrix();

  function nomChamp(el){
    if(el.type==='radio')return 'forfait souhaité';
    var l=el.closest('label'),sp=l&&l.querySelector('span');
    return sp?sp.childNodes[0].textContent.trim().toLowerCase():el.name;
  }
  function marquer(el,on){var c=el.type==='radio'?el.closest('.choix'):el;if(c)c.classList.toggle('invalide',on)}
  f.addEventListener('input',function(e){if(e.target.checkValidity&&e.target.checkValidity())marquer(e.target,false)});
  f.addEventListener('change',function(e){if(e.target.checkValidity&&e.target.checkValidity())marquer(e.target,false)});

  f.addEventListener('submit',function(e){
    e.preventDefault();
    verif();
    var manquants=[],premier=null,vus={};
    Array.prototype.forEach.call(f.elements,function(el){
      if(!el.willValidate||el.checkValidity()){if(el.willValidate)marquer(el,false);return}
      marquer(el,true);
      if(!premier)premier=el;
      var n=el===de&&de.value?'date (au moins 7 jours à l\u2019avance)':nomChamp(el);
      if(!vus[n]){vus[n]=1;manquants.push(n)}
    });
    if(premier){
      st.className='statut erreur';
      st.textContent='Il manque des informations ou une information est invalide : '+manquants.join(', ')+'.';
      if(!de.checkValidity()&&de.value)st.innerHTML+='<br>Pour une date plus rapprochée, contactez-nous par <span class="mobile-seul"><a href="sms:+14504211285">texto</a>, <a href="tel:+14504211285">appel</a> ou </span><a href="mailto:contact@lerepere.info?subject=Demande%20sp%C3%A9ciale">courriel</a>.';
      var cible=premier.type==='radio'?premier.closest('fieldset'):premier.closest('label')||premier;
      cible.scrollIntoView({behavior:'smooth',block:'center'});
      try{premier.focus({preventScroll:true})}catch(_){}
      return;
    }
    btn.disabled=true;btn.textContent='Envoi en cours…';st.className='statut';
    fetch(f.action,{method:'POST',headers:{'Accept':'application/json'},body:(function(){var fd=new FormData(f);fd.set('Événement extérieur',ext.checked?'Oui':'Non');return fd})()})
      .then(function(r){return r.json()})
      .then(function(d){
        if(!d.success)throw new Error(d.message);
        f.reset();
        document.getElementById('est-entreprise').dispatchEvent(new Event('change'));
        majDurees();du.value='1 journée';majAudience();majExt();majPrix();
        st.className='statut ok';
        st.textContent='Merci ! Votre demande est bien envoyée. On vérifie la disponibilité de la date et on vous répond rapidement par courriel.';
      })
      .catch(function(){
        st.className='statut erreur';
        st.innerHTML='Oups, l’envoi n’a pas fonctionné. Écrivez-nous directement à <a href="mailto:contact@lerepere.info?subject=Demande%20de%20soumission">contact@lerepere.info</a>.';
      })
      .finally(function(){btn.disabled=false;btn.textContent='Envoyer ma demande →'});
  });
})();
