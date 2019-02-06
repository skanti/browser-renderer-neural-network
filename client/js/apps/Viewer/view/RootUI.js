import React from "react";

class ImgUI extends React.Component {
    
	render() {
		console.log(this.props.src)

			return (
				<div>
					<img ref="image" src={this.props.src}/>
				</div>
			);
		}

}

class RootUI extends React.Component {
    
	render() {
		let content = null;
		if (this.props.is_webgl) {
			content = (<canvas id="id_div_canvas" style={{width:"100%", height:"100%"}}/>);
		} else {
			content = (<div id="id_div_pic" style={{width:"100%", height:"100%"}}/>);
		}

        return (
            <div id="id_div_root" className="container-fluid">
				<div id="id_div_panel" style={{width:"60vw", height: "80vh", position: "relative", marginTop:"0.5vw"}}>
					{content};
				</div>
            </div>
        );
    }

}


export {ImgUI, RootUI};
