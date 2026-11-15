const pages=["dashboard","students","admissions","fees","teachers","attendance","results","notifications"];
const byId=id=>document.getElementById(id);
function openPage(name){pages.forEach(p=>byId(p).classList.toggle("show",p===name));document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===name));byId("heading").textContent=name==="dashboard"?"Dashboard":name.charAt(0).toUpperCase()+name.slice(1);byId("sidebar").classList.remove("open")}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.open)));
byId("menu").addEventListener("click",()=>byId("sidebar").classList.toggle("open"));
byId("today").textContent=new Intl.DateTimeFormat("en-PK",{dateStyle:"medium"}).format(new Date());
let cameraStream=null;
let capturedPhoto=null;
const video=byId("cameraVideo"), canvas=byId("photoCanvas");
function stopCamera(){
  if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}
  video.srcObject=null;
  video.hidden=true;
  byId("capturePhoto").disabled=true;
}
function showPhoto(dataUrl){
  capturedPhoto=dataUrl;
  byId("photoImage").src=dataUrl;
  byId("photoImage").hidden=false;
  byId("photoPlaceholder").hidden=true;
  byId("retakePhoto").hidden=false;
  byId("cameraStatus").textContent="Photo selected. You can retake it or choose another photo.";
  stopCamera();
}
byId("startCamera").addEventListener("click",async()=>{
  if(!navigator.mediaDevices?.getUserMedia){
    byId("cameraStatus").textContent="Camera access is not available in this browser. Please use the photo upload option.";
    return;
  }
  try{
    stopCamera();
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
    video.srcObject=cameraStream;
    video.hidden=false;
    await video.play();
    byId("capturePhoto").disabled=false;
    byId("cameraStatus").textContent="Camera is ready. Position the student and select Capture Photo.";
  }catch(error){
    byId("cameraStatus").textContent="Camera permission was denied or the camera is unavailable. You can choose a photo from your device instead.";
    stopCamera();
  }
});
byId("capturePhoto").addEventListener("click",()=>{
  if(!cameraStream||!video.videoWidth)return;
  const maxWidth=900, scale=Math.min(1,maxWidth/video.videoWidth);
  canvas.width=Math.round(video.videoWidth*scale);
  canvas.height=Math.round(video.videoHeight*scale);
  canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);
  showPhoto(canvas.toDataURL("image/jpeg",0.82));
});
byId("retakePhoto").addEventListener("click",()=>{
  capturedPhoto=null;
  byId("photoImage").hidden=true;
  byId("photoImage").removeAttribute("src");
  byId("photoPlaceholder").hidden=false;
  byId("retakePhoto").hidden=true;
  byId("photoUpload").value="";
  byId("cameraStatus").textContent="Take a new photo or choose one from your device.";
});
byId("photoUpload").addEventListener("change",event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  if(!file.type.startsWith("image/")){byId("cameraStatus").textContent="Please choose an image file.";return;}
  if(file.size>8*1024*1024){byId("cameraStatus").textContent="Please choose a photo smaller than 8 MB.";event.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>showPhoto(reader.result);
  reader.readAsDataURL(file);
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopCamera();});
byId("admission").addEventListener("submit",e=>{
  e.preventDefault();
  if(!capturedPhoto){byId("cameraStatus").textContent="Student photo is required. Please take a photo or choose one from your device.";byId("startCamera").focus();return;}
  alert("Student photo captured successfully in this form preview. Secure admission saving and photo storage will be connected with the backend before real student records are entered.");
});
window.addEventListener("pagehide",stopCamera);
