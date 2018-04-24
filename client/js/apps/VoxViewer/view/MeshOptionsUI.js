import React from "react";

class MeshOptionsUI extends React.Component {
	constructor(props) {
		super(props);
		this.state = {is_checked_thresh : false};
	}

    render() {
        return (
			<button className="btn btn-primary" style={{position:"absolute", top:"5%", right:"5%"}} data-toggle="button" aria-pressed={this.state.is_checked_thresh ? "True" : "False"} autoComplete="off" 
				onClick={() => {this.toggle_thresh(), this.props.onclick_thresh(this.state.is_checked_thresh);}} > thresh </button>
        );
    }

	toggle_thresh(nextProps) {
		this.setState({is_checked_thresh : !this.state.is_checked_thresh});
	}
}


export default MeshOptionsUI;
