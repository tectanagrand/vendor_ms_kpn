"use strict";(self.webpackChunkui_vms=self.webpackChunkui_vms||[]).push([[928],{4677:function(e,n,t){t.d(n,{j:function(){return r}});var r=t(1243).Z.create({baseURL:"/api",withCredentials:!0})},903:function(e,n,t){t.d(n,{Z:function(){return c}});var r=t(1413),a=t(9195),s=t(5712),o=t(8550),i=t(184);function c(e){var n=e.name,t=e.label,c=e.control,u=e.options,l=e.onChangeovr,d=e.freeSolo,f=e.readOnly,p=e.disable,x=e.rules;return(0,i.jsx)(a.Qr,{name:n,control:c,rules:x,render:function(e){var n=e.field,a=n.onChange,c=n.value,x=n.ref,h=e.fieldState.error;return(0,i.jsx)(s.Z,{onChange:function(e,n){void 0!=l&&l(n),a(d?"object"===typeof n?n:null===n||void 0===n?void 0:n.toUpperCase():n)},value:c,error:h,options:u,freeSolo:d,autoSelect:d,fullWidth:!0,readOnly:f,disabled:p,renderInput:function(e){return(0,i.jsx)(o.Z,(0,r.Z)((0,r.Z)({},e),{},{label:t,error:h,inputRef:x}))}})}})}},204:function(e,n,t){t.d(n,{$:function(){return o}});var r=t(8550),a=t(9195),s=t(184),o=function(e){var n=e.control,t=e.label,o=e.name,i=e.rules,c=e.valueovr,u=e.readOnly,l=e.onChangeovr,d=e.toUpperCase,f=e.toLowerCase,p=e.helperText;return(0,s.jsx)(s.Fragment,{children:(0,s.jsx)(a.Qr,{name:o,control:n,rules:i,defaultValue:c,render:function(e){var n=e.field,a=n.onChange,o=n.value,i=n.ref,c=e.fieldState.error;return(0,s.jsx)(r.Z,{helperText:c?c.message:p,error:!!c,onChange:function(e){a(d?e.target.value.toUpperCase():f?e.target.value.toLowerCase():e)},onBlur:function(e){void 0!==l&&l(e.target.value)},inputRef:i,value:o,label:t,variant:"outlined",inputProps:{readOnly:u},fullWidth:!0})}})})}},1124:function(e,n,t){t.d(n,{Z:function(){return d}});var r=t(4165),a=t(5861),s=t(4677),o=t(2791),i=t(1243),c=t(8128),u=t(8329),l=function(){var e=(0,c.k)(),n=e.setAccessToken,t=(e.logOut,function(){var e=(0,a.Z)((0,r.Z)().mark((function e(){var t;return(0,r.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,i.Z.get("".concat("/api","/user/refresh"),{withCredentials:!0});case 3:return t=e.sent,n(t.data.accessToken),e.abrupt("return",t.data.accessToken);case 8:e.prev=8,e.t0=e.catch(0),console.log(e.t0),Object.keys(u.Z.get()).map((function(e){u.Z.remove(e)})),setTimeout((function(){window.location.replace("".concat(window.location.hostname,"/login"))}),100);case 13:case"end":return e.stop()}}),e,null,[[0,8]])})));return function(){return e.apply(this,arguments)}}());return t},d=function(){var e=l(),n=(0,c.k)().session;return(0,o.useEffect)((function(){var t=s.j.interceptors.request.use((function(e){return e.headers.Authorization||(e.headers.Authorization="Bearer ".concat(n.accessToken)),e}),(function(e){return Promise.reject(e)})),o=s.j.interceptors.response.use((function(e){return e}),function(){var n=(0,a.Z)((0,r.Z)().mark((function n(t){var a,o,i;return(0,r.Z)().wrap((function(n){for(;;)switch(n.prev=n.next){case 0:if(o=null===t||void 0===t?void 0:t.config,403!==(null===t||void 0===t||null===(a=t.response)||void 0===a?void 0:a.status)||null!==o&&void 0!==o&&o.sent){n.next=8;break}return o.sent=!0,n.next=5,e();case 5:return i=n.sent,o.headers.Authorization="Bearer ".concat(i),n.abrupt("return",(0,s.j)(o));case 8:return n.abrupt("return",Promise.reject(t));case 9:case"end":return n.stop()}}),n)})));return function(e){return n.apply(this,arguments)}}());return function(){s.j.interceptors.request.eject(t),s.j.interceptors.response.eject(o)}}),[n,e]),s.j}},1928:function(e,n,t){t.r(n),t.d(n,{default:function(){return P}});var r=t(1413),a=t(4165),s=t(5861),o=t(9439),i=t(5486),c=t(5009),u=t(2791),l=t(1124),d=t(1243),f=t(903),p=t(9709),x=t(68),h=t(3400),m=t(4554),v=t(6151),g=t(5574),Z=t(5661),b=t(7123),k=t(890),y=t(5351),w=t(4070),j=t(8820),C=t(5397),S=t(204),_=t(9195),L=t(184);function P(){var e=(0,_.cI)(),n=e.control,t=e.handleSubmit,P=e.clearErrors,q=e.reset,A=(0,l.Z)(),E=[{field:"country",type:"string",headerName:"Country",flex:.1,sortable:!1},{field:"bank_key",type:"string",headerName:"Bank Key",flex:.1,sortable:!1},{field:"bank_code",type:"string",headerName:"Swift Code",flex:.1,sortable:!1},{field:"bank_name",type:"string",headerName:"Bank Name",flex:.1,sortable:!1},{field:"actions",headerName:"Actions",renderCell:function(e){var n=[];return n.push((0,L.jsx)(x.Z,{title:"Edit",children:(0,L.jsx)(h.Z,{onClick:ie("Edit",e.row),children:(0,L.jsx)(j.Z,{})})})),n.push((0,L.jsx)(x.Z,{title:"Delete",children:(0,L.jsx)(h.Z,{onClick:ie("Delete",e.row),children:(0,L.jsx)(C.Z,{})})})),n}}],U=(0,u.useState)({page:0,maxPage:10,que:""}),D=(0,o.Z)(U,2),O=D[0],$=D[1],z=(0,u.useState)({isLoading:!1,rows:[{id:"",swift_code:"",bank_key:"",bank_code:"",bank_name:"",country:""}]}),B=(0,o.Z)(z,2),N=B[0],T=B[1],R=(0,u.useState)(""),M=(0,o.Z)(R,2),W=M[0],F=M[1],I=(0,u.useState)({stat:!1,type:"info",message:""}),K=(0,o.Z)(I,2),Q=K[0],G=K[1],H=(0,u.useState)(!1),V=(0,o.Z)(H,2),J=V[0],X=V[1],Y=(0,u.useState)(!1),ee=(0,o.Z)(Y,2),ne=ee[0],te=ee[1],re=(0,u.useRef)(),ae=(0,u.useRef)({value:"",label:""}),se=function(){X(!1),P()},oe=function(){G({stat:!1,type:"info",message:""})},ie=function(e,n){return function(){var t=(0,s.Z)((0,a.Z)().mark((function t(r){var s;return(0,a.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if("Edit"!==e){t.next=7;break}F("update"),q({swiftcode:n.bank_code,bankkey:n.bank_key,bankname:n.bank_name,address1:n.address_1,address2:n.address_2,address3:n.address_3,country:{value:n.country,label:"".concat(n.country," - ").concat(n.country_name)}}),re.current=n.id,X(!0),t.next=20;break;case 7:if("Delete"!==e){t.next=20;break}if(!confirm("Are you sure want to delete "+n.bank_name+"?")){t.next=20;break}return t.prev=9,t.next=12,A.post("/master/deletebank",{id:n.id});case 12:s=t.sent,G({stat:!0,type:"success",message:"".concat(s.data.name," is deleted")}),$({page:0,maxPage:O.maxPage,que:O.que}),t.next=20;break;case 17:t.prev=17,t.t0=t.catch(9),G({stat:!0,type:"error",message:t.t0.message});case 20:case"end":return t.stop()}}),t,null,[[9,17]])})));return function(e){return t.apply(this,arguments)}}()},ce=(0,u.useState)(0),ue=(0,o.Z)(ce,2),le=ue[0],de=ue[1],fe=function(e){var n=function(){var n=(0,s.Z)((0,a.Z)().mark((function n(){var t;return(0,a.Z)().wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,A.post("/master/ssrbank",{page:0,maxPage:O.maxPage,que:e.toLowerCase()});case 2:t=n.sent,T({isLoading:!1,rows:t.data.data}),de((function(e){return void 0!==t.data.allrow?t.data.allrow:e}));case 5:case"end":return n.stop()}}),n)})));return function(){return n.apply(this,arguments)}}();n(),$({page:0,maxPage:O.maxPage,que:e.toLowerCase()})},pe=function(){var e=(0,s.Z)((0,a.Z)().mark((function e(n){var t;return(0,a.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return te(!0),e.prev=1,e.next=4,A.post("/master/addbank",(0,r.Z)((0,r.Z)({},n),{},{country:n.country.value,type:W,id:re.current}));case 4:t=e.sent,G({stat:!0,type:"success",message:"".concat(t.data.name," is successfully ").concat("insert"===W?"added":"updated")}),X(!1),te(!1),e.next=15;break;case 10:e.prev=10,e.t0=e.catch(1),G({stat:!0,type:"error",message:e.t0.message}),X(!1),te(!1);case 15:case"end":return e.stop()}}),e,null,[[1,10]])})));return function(n){return e.apply(this,arguments)}}();return(0,u.useEffect)((function(){T((0,r.Z)((0,r.Z)({},N),{},{isLoading:!0}));var e=function(){var e=(0,s.Z)((0,a.Z)().mark((function e(){var n;return(0,a.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,A.post("/master/ssrbank",O);case 2:n=e.sent,T({isLoading:!1,rows:n.data.data}),de((function(e){return void 0!==n.data.allrow?n.data.allrow:e}));case 5:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();e()}),[O,ne]),(0,u.useEffect)((function(){var e=function(){var e=(0,s.Z)((0,a.Z)().mark((function e(){var n,t;return(0,a.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,d.Z.post("".concat("/api","/master/country"));case 3:n=e.sent,t=n.data.data,ae.current=t.data.map((function(e){return{value:e.country_code,label:"".concat(e.country_code," - ").concat(e.country_name)}})),e.next=11;break;case 8:e.prev=8,e.t0=e.catch(0),alert(e.t0.stack);case 11:case"end":return e.stop()}}),e,null,[[0,8]])})));return function(){return e.apply(this,arguments)}}();e()}),[]),(0,L.jsxs)(L.Fragment,{children:[(0,L.jsx)(m.Z,{sx:{display:"flex",justifyContent:"flex-end"},children:(0,L.jsx)(v.Z,{variant:"contained",sx:{width:180,height:50,my:2},onClick:function(){F("insert"),X(!0),q({swiftcode:"",bankkey:"",bankname:"",address1:"",address2:"",address3:"",country:""})},children:"+ Add new bank"})}),(0,L.jsx)(m.Z,{sx:{display:"flex",justifyContent:"flex-end",margin:1},children:(0,L.jsx)(c.Z,{value:O.que,onChange:fe,onCancelResearch:function(){fe("")},onSearch:function(){return fe(O.que)}})}),(0,L.jsx)(i._$,{sx:{"& .MuiDataGrid-main":{width:0,minWidth:"95%"}},rows:N.rows,columns:E,rowCount:parseInt(le),isLoading:N.isLoading,disableColumnFilter:!0,disableColumnSelector:!0,disableDensitySelector:!0,pageSizeOptions:[10],paginationModel:{page:O.page,pageSize:O.maxPage},paginationMode:"server",onPaginationModelChange:function(e){$((0,r.Z)((0,r.Z)({},O),{},{page:e.page,maxPage:e.pageSize}))}}),(0,L.jsxs)(g.Z,{maxWidth:"xl",open:J,onClose:se,children:[(0,L.jsx)(Z.Z,{children:"Add new bank"}),(0,L.jsxs)("form",{onSubmit:t(pe),children:[(0,L.jsxs)(m.Z,{sx:{width:800,height:"100%",padding:3,display:"flex",flexDirection:"column",gap:2},children:[(0,L.jsxs)(m.Z,{sx:{display:"flex",flexDirection:"row",gap:2},children:[(0,L.jsx)(S.$,{name:"swiftcode",label:"Swift Code",control:n,rules:{required:"Please insert this field",maxLength:{value:10,message:"Length exceeded 10 characters"}},toUpperCase:!0}),(0,L.jsx)(S.$,{name:"bankkey",label:"Bank Key",control:n,rules:{required:"Please insert this field",maxLength:{value:10,message:"Length exceeded 10 characters"}},toUpperCase:!0})]}),(0,L.jsx)(S.$,{name:"bankname",label:"Bank Name",control:n,rules:{required:"Please insert this field"},toUpperCase:!0}),(0,L.jsx)(S.$,{name:"address1",label:"Address 1",control:n,rules:{required:"Please insert this field",maxLength:{value:200,message:"Exceeded 200 characters"}},toUpperCase:!0}),(0,L.jsxs)(m.Z,{sx:{display:"flex",flexDirection:"row",gap:2},children:[(0,L.jsx)(f.Z,{name:"country",label:"Country",control:n,options:ae.current}),(0,L.jsx)(S.$,{name:"address2",label:"Address 2",control:n,rules:{maxLength:{value:50,message:"Exceeded 50 characters"}},toUpperCase:!0}),(0,L.jsx)(S.$,{name:"address3",label:"Address 3",control:n,rules:{maxLength:{value:50,message:"Exceeded 50 characters"}},toUpperCase:!0})]})]}),(0,L.jsxs)(b.Z,{children:[(0,L.jsx)(v.Z,{sx:{width:120,m:1},color:"secondary",onClick:se,children:(0,L.jsx)(k.Z,{children:"Cancel"})}),(0,L.jsx)(p.Z,{sx:{width:120,m:1},variant:"contained",type:"submit",loading:ne,children:(0,L.jsx)(k.Z,{children:"Submit"})})]})]})]}),(0,L.jsx)(y.Z,{open:Q.stat,onClose:oe,autoHideDuration:3e3,anchorOrigin:{vertical:"top",horizontal:"right"},children:(0,L.jsx)(w.Z,{severity:Q.type,onClose:oe,variant:"filled",children:Q.message})})]})}}}]);
//# sourceMappingURL=928.cbb2190d.chunk.js.map