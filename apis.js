export async function getNew(){
    const response= await fetch('http://f98e-23-99-126-142.ngrok.io/api/product/list');
    const jsonData= await response.json();
    return jsonData.articles;
}
