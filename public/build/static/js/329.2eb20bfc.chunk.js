"use strict";(self.webpackChunkui_vms=self.webpackChunkui_vms||[]).push([[329],{4677:function(e,t,n){n.d(t,{j:function(){return r}});var r=n(1243).Z.create({baseURL:"/api",withCredentials:!0})},773:function(e,t,n){n.d(t,{Z:function(){return o}});var r=n(68),s=n(890),i=n(3439),a=n(9709),c=n(184);function o(e){return(0,c.jsx)(r.Z,{title:(0,c.jsx)(s.Z,{children:"Refresh"}),children:(0,c.jsx)(a.Z,{loading:e.isLoading,onClick:function(){e.setRefreshbtn(!0)},sx:e.sx,variant:"contained",children:(0,c.jsx)(i.Z,{})})})}},6467:function(e,t,n){n.d(t,{Z:function(){return R}});var r=n(9439),s=n(4554),i=n(9281),a=n(9836),c=n(6890),o=n(5855),u=n(3994),l=n(3382),h=n(890),d=n(8582),x=n(3157),Z=n(558),f=n(1235),j=n(318),p=n(9384),v=n(8820),g=n(3400),m=n(68),w=n(6125),k=n(8550),b=n(2791),C=n(184);function y(e){var t=e.row,n=e.length,s=e.button,i=e.setAction,a=(0,b.useState)(!1),c=(0,r.Z)(a,2),l=c[0],d=c[1],x=function(e,t){i(e,t)},y=0;return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsxs)(o.Z,{children:["details"in t&&(0,C.jsx)(u.Z,{children:(0,C.jsx)(g.Z,{onClick:function(){d(!l)},children:l?(0,C.jsx)(Z.Z,{}):(0,C.jsx)(f.Z,{})})}),Object.keys(t).map((function(e){if("details"!=e&&"id"!=e)return(0,C.jsx)(u.Z,{align:"left",children:t[e]},"".concat(y++,"-cell"))})),(0,C.jsx)(u.Z,{children:0!=s.length&&s.map((function(e){switch(e){case"accept":return(0,C.jsx)(m.Z,{title:(0,C.jsx)(h.Z,{children:e}),children:(0,C.jsx)(g.Z,{sx:{backgroundColor:"#4ef542",mx:1},onClick:function(){return x(e,t.id)},children:(0,C.jsx)(j.Z,{})})},"".concat(e,"-").concat(y++));case"reject":case"deactive":return(0,C.jsx)(m.Z,{title:(0,C.jsx)(h.Z,{children:e}),children:(0,C.jsx)(g.Z,{sx:{backgroundColor:"#f2573f",mx:1},onClick:function(){return x(e,t.id)},children:(0,C.jsx)(p.Z,{})})},"".concat(e,"-").concat(y++));case"edit":return(0,C.jsx)(m.Z,{title:(0,C.jsx)(h.Z,{children:e}),children:(0,C.jsx)(g.Z,{sx:{backgroundColor:"primary.light",mx:1},onClick:function(){return x(e,t.id)},children:(0,C.jsx)(v.Z,{})})},"".concat(e,"-").concat(y++))}}))})]}),(0,C.jsx)(o.Z,{children:(0,C.jsx)(u.Z,{colSpan:n,sx:{padding:0,margin:0},children:(0,C.jsxs)(w.Z,{in:l,timeout:"auto",unmountOnExit:!0,children:[(0,C.jsx)(h.Z,{variant:"h6",sx:{mx:2,my:2},children:"Details"}),(0,C.jsx)(k.Z,{inputProps:{readOnly:!0},multiline:!0,value:t.details,fullWidth:!0,sx:{px:4}})]})})})]})}var S=n(5009);function R(e){var t=e.data,n=e.header,Z=e.buttons,f=e.lengthRow,j=e.onAction,p=function(e,t){j(e,t)},v=(0,b.useState)(t),g=(0,r.Z)(v,2),m=g[0],w=g[1],k=(0,b.useState)(""),R=(0,r.Z)(k,2),A=R[0],q=R[1],P=(0,b.useState)(0),D=(0,r.Z)(P,2),O=D[0],E=D[1],T=(0,b.useState)(5),L=(0,r.Z)(T,2),N=L[0],z=(L[1],(0,b.useState)(0)),V=(0,r.Z)(z,2),_=V[0],F=V[1];(0,b.useEffect)((function(){F(Math.max(0,N-m.slice(O*N,O*N+N).length))}),[]),(0,b.useEffect)((function(){w(t),F(Math.max(0,N-t.slice(O*N,O*N+N).length))}),[t]);var H=function(e){var n=t.filter((function(t){var n=!1;return Object.values(t).map((function(t){null!==t&&t.toString().toLowerCase().includes(e.toString().toLowerCase())&&(n=!0)})),n}));w(n)},M=0;return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(s.Z,{sx:{display:"flex",justifyContent:"flex-end",margin:1},children:(0,C.jsx)(S.Z,{value:A,onChange:H,onCancelResearch:function(){q(""),H(A)},onSearch:function(e){return q(e)}})}),(0,C.jsx)(i.Z,{sx:{maxHeight:440},children:(0,C.jsxs)(a.Z,{stickyHeader:!0,"aria-label":"sticky table",children:[(0,C.jsx)(c.Z,{children:(0,C.jsxs)(o.Z,{children:[0!=t.length&&"details"in t[0]&&(0,C.jsx)(u.Z,{children:"details"},"details"),n.map((function(e){return(0,C.jsx)(u.Z,{children:e},e)})),0!=Z.length&&(0,C.jsx)(u.Z,{},"buttons")]})}),(0,C.jsxs)(l.Z,{children:[0!=t.length&&(N>0?m.slice(O*N,O*N+N):m).map((function(e){return(0,C.jsx)(y,{row:e,length:f,button:Z,setAction:p},"".concat(M++))})),_>0&&0!=t.length&&(0,C.jsx)(o.Z,{style:{height:74.5*_},children:(0,C.jsx)(u.Z,{colSpan:f})}),0==t.length&&(0,C.jsx)(o.Z,{style:{height:74.5*_},children:(0,C.jsx)(u.Z,{colSpan:f,children:(0,C.jsx)(h.Z,{variant:"h5",sx:{textAlign:"center"},children:"Empty Data"})})})]})]})}),(0,C.jsxs)(a.Z,{children:[(0,C.jsx)(c.Z,{}),(0,C.jsx)(l.Z,{}),(0,C.jsx)(d.Z,{children:(0,C.jsx)(o.Z,{children:(0,C.jsx)(x.Z,{rowsPerPageOptions:[5,10,25,{label:"All",value:-1}],colSpan:f,count:m.length,rowsPerPage:N,page:O,SelectProps:{inputProps:{"aria-label":"rows per page"},native:!0},onPageChange:function(e,t){E((function(e){return F(t>0?Math.max(0,N-m.slice(t*N,t*N+N).length):0),t}))}})})})]})]})}},1124:function(e,t,n){n.d(t,{Z:function(){return h}});var r=n(4165),s=n(5861),i=n(4677),a=n(2791),c=n(1243),o=n(8128),u=n(8329),l=function(){var e=(0,o.k)(),t=e.setAccessToken,n=(e.logOut,function(){var e=(0,s.Z)((0,r.Z)().mark((function e(){var n;return(0,r.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,c.Z.get("".concat("/api","/user/refresh"),{withCredentials:!0});case 3:return n=e.sent,t(n.data.accessToken),e.abrupt("return",n.data.accessToken);case 8:e.prev=8,e.t0=e.catch(0),console.log(e.t0),Object.keys(u.Z.get()).map((function(e){u.Z.remove(e)})),setTimeout((function(){window.location.replace("".concat(window.location.hostname,"/login"))}),100);case 13:case"end":return e.stop()}}),e,null,[[0,8]])})));return function(){return e.apply(this,arguments)}}());return n},h=function(){var e=l(),t=(0,o.k)().session;return(0,a.useEffect)((function(){var n=i.j.interceptors.request.use((function(e){return e.headers.Authorization||(e.headers.Authorization="Bearer ".concat(t.accessToken)),e}),(function(e){return Promise.reject(e)})),a=i.j.interceptors.response.use((function(e){return e}),function(){var t=(0,s.Z)((0,r.Z)().mark((function t(n){var s,a,c;return(0,r.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(a=null===n||void 0===n?void 0:n.config,403!==(null===n||void 0===n||null===(s=n.response)||void 0===s?void 0:s.status)||null!==a&&void 0!==a&&a.sent){t.next=8;break}return a.sent=!0,t.next=5,e();case 5:return c=t.sent,a.headers.Authorization="Bearer ".concat(c),t.abrupt("return",(0,i.j)(a));case 8:return t.abrupt("return",Promise.reject(n));case 9:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}());return function(){i.j.interceptors.request.eject(n),i.j.interceptors.response.eject(a)}}),[t,e]),i.j}},5329:function(e,t,n){n.r(t),n.d(t,{default:function(){return C}});var r=n(4165),s=n(5861),i=n(1413),a=n(9439),c=n(8096),o=n(8406),u=n(3786),l=n(4554),h=n(7047),d=n(5351),x=n(4070),Z=n(5574),f=n(890),j=n(6151),p=n(2791),v=n(8128),g=n(6467),m=n(1124),w=n(9709),k=n(773),b=n(184);function C(){var e=(0,m.Z)(),t=(0,p.useState)(),n=(0,a.Z)(t,2),C=n[0],y=n[1],S=["Ticket Number","Date","Requestor","Request","Vendor Code","Vendor Name"],R=(0,v.k)().session,A=(0,p.useState)(["accept","reject"]),q=(0,a.Z)(A,2),P=q[0],D=q[1],O=(0,p.useState)(!0),E=(0,a.Z)(O,2),T=E[0],L=E[1],N=(0,p.useState)(!0),z=(0,a.Z)(N,2),V=z[0],_=z[1],F=(0,p.useState)(!1),H=(0,a.Z)(F,2),M=H[0],B=H[1],I=(0,p.useState)(""),U=(0,a.Z)(I,2),W=U[0],Y=U[1],G=(0,p.useState)({}),J=(0,a.Z)(G,2),K=J[0],Q=J[1],X=(0,p.useState)(),$=(0,a.Z)(X,2),ee=$[0],te=$[1],ne=(0,p.useState)(0),re=(0,a.Z)(ne,2),se=re[0],ie=re[1],ae=(0,p.useState)(!0),ce=(0,a.Z)(ae,2),oe=ce[0],ue=ce[1],le=(0,p.useState)({stat:!1,type:"success",message:""}),he=(0,a.Z)(le,2),de=he[0],xe=he[1],Ze=function(e,t){"clickaway"!==t&&xe((0,i.Z)((0,i.Z)({},de),{},{stat:!1}))},fe=function(){var t=(0,s.Z)((0,r.Z)().mark((function t(n,s){var i,a;return(0,r.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return y(!0),t.prev=1,i={ticketid:s,session:R.user_id,action:n},t.next=5,e.post("/reqstat/process",i);case 5:a=t.sent,xe({stat:!0,type:"success",message:a.data.message}),B(!1),_(!V),y(!1),t.next=16;break;case 12:t.prev=12,t.t0=t.catch(1),y(!1),xe({stat:!0,type:"error",message:t.t0});case 16:case"end":return t.stop()}}),t,null,[[1,12]])})));return function(e,n){return t.apply(this,arguments)}}();return(0,p.useEffect)((function(){var t=function(){var t=(0,s.Z)((0,r.Z)().mark((function t(){var n;return(0,r.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,e.get("/reqstat/show?is_active=".concat(oe));case 3:n=t.sent,te(n.data.data),L(!1),t.next=13;break;case 8:t.prev=8,t.t0=t.catch(0),console.log(t.t0),alert(t.t0),L(!1);case 13:case"end":return t.stop()}}),t,null,[[0,8]])})));return function(){return t.apply(this,arguments)}}();D(!1===oe?[]:["accept","reject"]),T&&t()}),[V,oe,T]),(0,p.useEffect)((function(){ie(S.length+1)}),[ee]),(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(c.Z,{children:(0,b.jsxs)(o.Z,{sx:{width:"10em"},id:"filterAct",value:oe,onChange:function(){ue(!oe),L(!0)},children:[(0,b.jsx)(u.Z,{value:!0,children:"Active"}),(0,b.jsx)(u.Z,{value:!1,children:"Not Active"})]})}),(0,b.jsx)(k.Z,{setRefreshbtn:function(){L(!0)},isLoading:T,sx:{width:"3.5rem",height:"3.5rem",ml:2}}),void 0!=ee?(0,b.jsx)(g.Z,{data:ee,buttons:P,lengthRow:se,onAction:function(e,t){B(!0),Y(e),Q(ee.find((function(e){return e.id===t})))},header:S}):(0,b.jsxs)(l.Z,{children:[(0,b.jsx)(h.Z,{animation:"wave",height:100}),(0,b.jsx)(h.Z,{animation:"wave",height:100}),(0,b.jsx)(h.Z,{animation:"wave",height:100}),(0,b.jsx)(h.Z,{animation:"wave",height:100}),(0,b.jsx)(h.Z,{animation:"wave",height:100})]}),(0,b.jsx)(d.Z,{open:de.stat,onClose:Ze,autoHideDuration:3e3,anchorOrigin:{vertical:"top",horizontal:"right"},children:(0,b.jsx)(x.Z,{severity:de.type,onClose:Ze,variant:"filled",children:de.message})}),(0,b.jsx)(Z.Z,{open:M,onClose:function(){B(!1)},children:(0,b.jsxs)(l.Z,{sx:{width:400,height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[(0,b.jsxs)(f.Z,{variant:"h4",children:["Are you sure want to ",W," ?"]}),"Reactivation"==K.RequestDesc&&(0,b.jsx)(f.Z,{variant:"h5",children:"Reactivation Request"}),"Deactivation"==K.RequestDesc&&(0,b.jsx)(f.Z,{variant:"h5",children:"Deactivation Request"}),(0,b.jsxs)(f.Z,{variant:"h6",children:[K["Vendor Name"]," - ",K["Vendor Code"]," "]}),(0,b.jsxs)(l.Z,{sx:{display:"flex",gap:2,mt:4},children:[(0,b.jsx)(w.Z,{sx:{width:50},variant:"contained",onClick:function(e){return fe(W,K.id)},loading:C,children:(0,b.jsx)(f.Z,{children:"Yes"})}),(0,b.jsx)(j.Z,{sx:{width:50},variant:"contained",onClick:function(){B(!1)},children:(0,b.jsx)(f.Z,{children:"No"})})]})]})})]})}}}]);
//# sourceMappingURL=329.2eb20bfc.chunk.js.map