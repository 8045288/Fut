/* Dados 100% fictícios. */
const FIRST_NAMES=["João","Lucas","Miguel","Gabriel","Pedro","Rafael","Davi","Caio","Matheus","Bruno","Enzo","Arthur","Henrique","Felipe","Gustavo","Samuel","Diego","Vitor","Leonardo","André","Nicolas","Murilo","Luan","Breno","Yuri","Igor","Thiago","Renan","Danilo","Alex"];
const LAST_NAMES=["Silva","Souza","Oliveira","Costa","Santos","Almeida","Lima","Pereira","Carvalho","Rocha","Mendes","Ferreira","Ribeiro","Barbosa","Teixeira","Martins","Azevedo","Moura","Freitas","Cardoso"];
const COUNTRIES=["Brasil","Argentina","Uruguai","Colômbia","Chile","México","Portugal","Espanha","França","Itália"];
const POSITIONS=["GOL","ZAG","LE","LD","VOL","MC","ME","MD","MAT","PE","PD","ATA"];
const FORMATIONS={
 "4-4-2":["GOL","LD","ZAG","ZAG","LE","MD","MC","MC","ME","ATA","ATA"],
 "4-3-3":["GOL","LD","ZAG","ZAG","LE","VOL","MC","MAT","PE","ATA","PD"],
 "4-2-3-1":["GOL","LD","ZAG","ZAG","LE","VOL","VOL","ME","MAT","MD","ATA"],
 "3-5-2":["GOL","ZAG","ZAG","ZAG","ME","MC","VOL","MC","MD","ATA","ATA"],
 "5-3-2":["GOL","LD","ZAG","ZAG","LE","ME","VOL","MC","MD","ATA","ATA"],
 "4-4-1-1":["GOL","LD","ZAG","ZAG","LE","MD","MC","MC","ME","MAT","ATA"]
};
const CLUB_SEEDS=[
["União Paulista","Brasil","Liga Brasileira",1,42,78,"Estádio União","Paulistas"],
["Atlético Nacional do Sul","Brasil","Liga Brasileira",1,38,74,"Arena do Sul","Nação Sulista"],
["Real Carioca","Brasil","Liga Brasileira",1,55,82,"Estádio Imperial","Cariocas"],
["Bahia FC","Brasil","Liga Brasileira",1,34,76,"Arena Atlântica","Tricolores"],
["Vitória do Nordeste","Brasil","Liga Brasileira",1,31,72,"Estádio Sertão","Nordestinos"],
["Porto Verde","Brasil","Liga Brasileira",1,29,70,"Arena Verde","Verdes"],
["Minas Esporte","Brasil","Liga Brasileira",1,27,69,"Estádio Mineiro","Mineiros"],
["Aurora FC","Brasil","Liga Brasileira",1,24,67,"Arena Aurora","Aurorianos"],
["Guará Clube","Brasil","Liga Brasileira",1,21,65,"Estádio Guará","Guarás"],
["Cataratas FC","Brasil","Liga Brasileira",1,19,63,"Arena das Águas","Cataratas"],
["Andes United","Argentina","Liga Platina",1,40,75,"Estadio Andes","Andinos"],
["Rosario Centralino","Argentina","Liga Platina",1,33,71,"Parque Central","Centralinos"],
["Montevideo Sol","Uruguai","Liga Platina",1,37,73,"Sol Arena","Solarinos"],
["Bogotá Real","Colômbia","Liga Andina",1,36,74,"Estadio Capital","Capitalinos"],
["Pacifico Azul","Chile","Liga Andina",1,28,68,"Arena Pacifico","Azuis"],
["Azteca FC","México","Liga Norte",1,45,77,"Estadio Azteca Nova","Aztecas"],
["Lisboa Atlética","Portugal","Liga Ibérica",1,52,79,"Arena Lusitana","Lisboetas"],
["Madrid Sol","Espanha","Liga Ibérica",1,58,84,"Estadio Sol","Madrilenos"],
["Lyon Étoile","França","Liga Europeia",1,50,80,"Stade Étoile","Étoiles"],
["Torino Nova","Itália","Liga Europeia",1,47,78,"Stadio Nova","Torineses"]
];
const COLORS=["#2dd4bf","#4ea1ff","#a78bfa","#f97316","#ef4444","#eab308","#22c55e","#ec4899","#06b6d4","#8b5cf6"];

function makeId(prefix="id"){return prefix+"_"+Math.random().toString(36).slice(2,9)+"_"+Date.now().toString(36)}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function makeName(){return pick(FIRST_NAMES)+" "+pick(LAST_NAMES)}
function createPlayer(overall, position, age=rand(18,32)){
 const potential=Math.max(overall+rand(3,18),overall);
 const ageFactor=age<21?1.45:age<25?1.30:age<29?1.05:age<32?.82:.62;
 const potentialFactor=1+Math.max(0,potential-overall)*0.035;
 const value=Math.max(450000,Math.round(Math.pow(overall,3)*35*ageFactor*potentialFactor));
 return {id:makeId("p"),name:makeName(),age,nation:pick(COUNTRIES),position,overall,potential,
 value,salary:Math.round(Math.pow(overall,2)*6.2+rand(500,2200)),energy:100,morale:rand(70,90),form:rand(65,90),contract:rand(1,4),number:0,goals:0,assists:0,apps:0,yellow:0,red:0,injury:0};
}
function createClub(seed,i){
 const [name,country,league,division,money,strength,stadium,fans]=seed;
 const players=[];
 const counts={GOL:2,ZAG:4,LE:2,LD:2,VOL:2,MC:3,ME:2,MD:2,MAT:2,PE:2,PD:2,ATA:3};
 Object.entries(counts).forEach(([pos,n])=>{for(let j=0;j<n;j++) players.push(createPlayer(Math.max(45,strength+rand(-10,5)),pos,rand(18,33)))});
 players.forEach((p,j)=>p.number=j+1);
 return {id:"club_"+i,name,country,league,division,money:money*1000000,strength,stadium,fans,players,coach:"Treinador "+pick(LAST_NAMES)};
}
const BASE_CLUBS=CLUB_SEEDS.map(createClub);