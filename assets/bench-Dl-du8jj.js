import{r as e}from"./rolldown-runtime-C0FnF6B9.js";import{c as t,i as n,l as r,r as i,t as a}from"./db-ggyglRVm.js";import{c as o}from"./generate-CFCDkceq.js";import{t as s}from"./settings-DJ5Fm-mD.js";import{m as c,p as l}from"./provider-WjaBifTZ.js";import{r as u}from"./extract-BCVD-FkO.js";var d=e({BENCH_COURSE:()=>f,BENCH_FACTS:()=>p,cleanupBench:()=>x,numbersIn:()=>_,runBench:()=>S,scoreSheet:()=>y,sheetText:()=>v}),f=`# L'élasticité-prix de la demande

L'élasticité-prix de la demande mesure la sensibilité de la quantité demandée d'un bien à une variation de son prix. Elle se calcule comme le rapport entre la variation relative de la quantité demandée et la variation relative du prix : e = (ΔQ / Q) / (ΔP / P).

Comme la demande baisse en général quand le prix monte, l'élasticité-prix est le plus souvent négative. On raisonne alors sur sa valeur absolue.

Exemple : le prix d'un abonnement passe de 20 € à 22 €, soit une hausse de 10 %. Le nombre d'abonnés passe de 1 000 à 950, soit une baisse de 5 %. L'élasticité vaut -5 / 10 = -0,5.

# Demande élastique et demande inélastique

Quand la valeur absolue de l'élasticité est supérieure à 1, la demande est dite élastique : la quantité varie proportionnellement plus que le prix. C'est le cas des biens qui ont beaucoup de substituts, comme une marque de céréales.

Quand elle est inférieure à 1, la demande est inélastique : la quantité réagit peu. C'est le cas des biens de première nécessité et des biens sans substitut proche, comme l'essence à court terme, dont l'élasticité est souvent estimée autour de -0,25.

Une élasticité égale à 1 en valeur absolue est dite unitaire.

# Élasticité et recette totale

La recette totale du vendeur est égale au prix multiplié par la quantité vendue (RT = P × Q).

Si la demande est inélastique, une hausse du prix augmente la recette totale. Si la demande est élastique, une hausse du prix fait baisser la recette totale. Dans l'exemple de l'abonnement, la recette passe de 20 000 € à 20 900 €.

Piège fréquent : confondre la pente de la courbe de demande et l'élasticité. Sur une droite de demande, la pente est constante mais l'élasticité change d'un point à l'autre.

# Les déterminants de l'élasticité

Trois facteurs rendent la demande plus élastique : l'existence de substituts, la part du bien dans le budget du ménage, et l'horizon de temps. À long terme, les consommateurs ont le temps de changer leurs habitudes, donc la demande est plus élastique qu'à court terme.
`,p=[{label:`Définition : sensibilité de la quantité au prix`,all:[[`sensibilite`,`reaction`,`reagit`],[`quantite`],[`prix`]]},{label:`Formule : variation relative de Q sur variation relative de P`,all:[[`δq`,`Δq`,`delta q`,`\\delta q`,`variation relative de la quantite`],[`δp`,`Δp`,`delta p`,`\\delta p`,`variation relative du prix`]]},{label:`Élasticité le plus souvent négative`,all:[[`negative`,`negatif`,`signe moins`]]},{label:`Exemple chiffré : -0,5`,all:[[`0,5`,`0.5`]]},{label:`Élastique si |e| > 1`,all:[[`elastique`],[`superieure a 1`,`> 1`,`>1`,`plus grande que 1`,`superieur a 1`]]},{label:`Inélastique si |e| < 1`,all:[[`inelastique`],[`inferieure a 1`,`< 1`,`<1`,`inferieur a 1`]]},{label:`Biens avec substituts : élastiques`,all:[[`substitut`]]},{label:`Essence à court terme : environ -0,25`,all:[[`essence`],[`0,25`,`0.25`]]},{label:`Élasticité unitaire`,all:[[`unitaire`]]},{label:`Recette totale = P × Q`,all:[[`recette`],[`p × q`,`p x q`,`p \\times q`,`p·q`,`p * q`,`prix multiplie par la quantite`,`prix × quantite`,`prix x quantite`]]},{label:`Inélastique : hausse du prix, recette en hausse`,all:[[`inelastique`],[`recette`],[`augmente`,`hausse`,`monte`]]},{label:`Piège : pente et élasticité`,all:[[`pente`]]},{label:`Déterminant : part du budget`,all:[[`budget`]]},{label:`Plus élastique à long terme`,all:[[`long terme`]]}],m=e=>e.toLowerCase().normalize(`NFD`).replace(/[̀-ͯ]/g,``).replace(/\s+/g,` `),h=/-?\d+(?:[\s ]\d{3})*(?:[.,]\d+)?/g,g=e=>e.replace(/[\s ]/g,``).replace(`,`,`.`).replace(/^-/,``);function _(e){return[...e.matchAll(h)].map(e=>g(e[0])).filter(e=>e.includes(`.`)||Number(e)>=10)}function v(e){return[e.summary,...e.sections.flatMap(e=>[e.heading,...e.blocks.map(e=>`${e.term??``} ${e.content}`)]),...e.keyPoints].join(`
`)}function y(e,t=f){let n=m(v(e)),r=p.map(e=>({label:e.label,found:e.all.every(e=>e.some(e=>n.includes(m(e))))})),i=e.sections.flatMap(e=>e.blocks),a=new Set(_(t));return{facts:r,covered:r.filter(e=>e.found).length,blocks:i.length,unsourced:i.filter(e=>!e.sources.length).length,doubtful:i.filter(e=>e.sources.length&&e.check&&e.check!==`ok`).length,wrongNumbers:[...new Set(_(v(e)).filter(e=>!a.has(e)))]}}var b=`[Banc d’essai]`;async function x(){for(let e of await a.subjects.filter(e=>e.name===b&&e.color===`#888888`).toArray())await i(e.id)}async function S(e=()=>{}){let d=r(),p=Date.now(),m=l();await a.subjects.add({id:d,name:b,color:`#888888`,lang:`fr`,createdAt:Date.now()});try{e(`Lecture du cours de référence`);let r=await u(new File([f],`banc-essai.md`,{type:`text/markdown`}),d,!1,()=>{}),i=await o(d,[r.id],`normal`,e),a={at:Date.now(),model:c(m)??s().geminiModel,seconds:Math.round((Date.now()-p)/1e3),...y(i)},l=await n(`bench.history`,[]);return await t(`bench.history`,[a,...l].slice(0,20)),a}finally{await i(d)}}export{d as n,S as r,p as t};