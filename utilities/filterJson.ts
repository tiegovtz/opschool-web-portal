// 🔍 Filter function
const filterContentBySearch = (content: any[],searchValue:String) => {
    if(content.length == 0 ) return content;
    if(!searchValue.trim()) return content;
    return content.filter(item =>
        Object.values(item).some(val =>
            val && typeof (val) == 'string' && val.toString().toLowerCase().includes(searchValue.toLowerCase())
        )
    )
};

export {
    filterContentBySearch
}