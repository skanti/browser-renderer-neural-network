import React from "react";

class BrowseUI extends React.Component {
	constructor(props) {
		super(props);
	}

    render() {
        return (
			<form className="form-inline">
			    <input type="text" className="form-control" id="id_input_browse" placeholder="Enter filename" />
				<button type="button" className="btn btn-primary" onClick={this.props.onclick.bind(null)} style={{marginLeft :"0.5vw"}}> Submit </button>
			</form>
        );
    }
}


export default BrowseUI;
