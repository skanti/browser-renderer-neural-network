import React from "react";

class RootUI extends React.Component {
    
	render() {
        return (
            <div id="id_div_root" className="container-fluid">
				<div style={{marginTop:"1vh"}}>
					<div id="id_div_browse" style={{marginRight:"0.5vw", display:"inline-block"}}/>
					<div id="id_div_metadata"  style={{marginRight:"0.5vw", display:"inline-block"}}/>
				</div>
				<div id="id_div_panel0" style={{width:"60vw", height: "80vh", position: "relative", marginTop:"0.5vw"}}>
					<canvas id="id_div_canvas0" style={{width:"100%", height:"100%"}}/>
					<div id="id_meshoptions0"/>
				</div>
            </div>
        );
    }

}


export default RootUI;
