const pages=["dashboard","students","admissions","fees","teachers","attendance","results","notifications"];
const byId=id=>document.getElementById(id);
function openPage(name){pages.forEach(p=>byId(p).classList.toggle("show",p===name));document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===name));byId("heading").textContent=name==="dashboard"?"Dashboard":name.charAt(0).toUpperCase()+name.slice(1);byId("sidebar").classList.remove("open")}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.open)));
byId("menu").addEventListener("click",()=>byId("sidebar").classList.toggle("open"));
byId("today").textContent=new Intl.DateTimeFormat("en-PK",{dateStyle:"medium"}).format(new Date());
byId("admission").addEventListener("submit",e=>{e.preventDefault();alert("The app interface is ready. Admissions will be saved after the secure backend and admin login are connected. Do not enter real student data yet.");});
