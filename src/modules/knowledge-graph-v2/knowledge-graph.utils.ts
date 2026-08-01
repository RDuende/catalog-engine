export function slugify(value:string):string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
export function normalizeKey(value:string):string { return slugify(value).replace(/-/g,"_"); }
