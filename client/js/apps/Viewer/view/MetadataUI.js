import React from "react";

class MetadataUI extends React.Component {
    render() {
        return (
			<div className="container-fluid" style={{marginTop:"1vh"}}> 
				{
					this.props.cargo.map(item => {
						return this.create_button(item[0] + ": " + item[1])
					})
				}
			</div>
        );
    }

	create_button(val) {
		return <button className="btn btn-outline-primary" key={"key" + val} style={{marginRight: "0.5vw"}}> {val} </button> 
	}
}


export default MetadataUI;
