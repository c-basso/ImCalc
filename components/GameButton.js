import _ from 'lodash';
import React from 'react';
import {
	Text,
	View,
	TouchableHighlight,
	StyleSheet,
	Dimensions
} from 'react-native';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			status: props.status,
			initButtonStyle: this._getInitButtonStyle(),
			statusButtonStyle: this._getStatusButtonStyle(props.status),
			statusButtonTextStyle: this._getStatusButtonTextStyle(props.status)
		};
	}

	_getInitButtonStyle() {
		const styles = [
			{
				backgroundColor: '#76ab9e',
				borderColor: '#76ab9e'
			},
			{
				backgroundColor: '#eb4b4b',
				borderColor: '#eb4b4b'
			},
			{
				backgroundColor: '#eba554',
				borderColor: '#eba554'
			},
			{
				backgroundColor: '#57454b',
				borderColor: '#57454b'
			},
			{
				backgroundColor: '#74ab76',
				borderColor: '#74ab76'
			}
		];

		return styles[getRandomInt(0, styles.length - 1)];
	}

	_getStatusButtonStyle(status = 'inited') {
		if (status === 'pressed') {
			return {
				backgroundColor: '#fff',
				borderColor: '#fff'
			};
		}

		if (status === 'success') {
			return {
				backgroundColor: '#009900',
				borderColor: '#009900'
			};
		}

		if (status === 'error') {
			return {
				backgroundColor: '#cc3300',
				borderColor: '#cc3300'
			};
		}

		return {};
	}

	componentWillReceiveProps(next) {
		if (next.reInit) {
			const initButtonStyle = this._getInitButtonStyle();
			this.setState({initButtonStyle});
		}

		if (next.status !== this.state.status) {
			const status = next.status;
			const value = next.value;

			const statusButtonStyle = this._getStatusButtonStyle(status);
			const statusButtonTextStyle = this._getStatusButtonTextStyle(status);

			this.setState({status, value, statusButtonStyle, statusButtonTextStyle});
		}
	}


	_getStatusButtonTextStyle(status = 'inited') {
		let style = {};
		if (status === 'pressed') {
			style = {
				color: '#000'
			};
		}
		return style;
	}

	render() {
		const length = this.props.value.toString().length;

		let fontSize = 30;

		if (length >= 5) {
			const coof = length - 4;
			const corrector = coof * 6;
			fontSize = fontSize - corrector;
			fontSize = fontSize < 16 ? 16 : fontSize;
		}

		return (
			<View style={styles.wrapper}>
				<TouchableHighlight
					onPress={() => this.props.onPress(this.props.index)}
					style={[
						styles.button,
						this.state.initButtonStyle,
						this.state.statusButtonStyle
					]}>
					<Text style={[
						styles.buttonText,
						this.state.statusButtonTextStyle,
						{fontSize}
					]}>{this.props.value}</Text>
				</TouchableHighlight>
			</View>
		);
	}
}

const {width} = Dimensions.get('window');

const btnSize = (() => {
	if (width === 320) {
		return 72;
	}
	if (width === 375) {
		return 78;
	}
	if (width === 414) {
		return 87;
	}
})();

const styles = StyleSheet.create({
	wrapper: {
	},
	button: {
		backgroundColor: 'transparent',
		borderStyle: 'solid',
		borderColor: '#fff',
		borderRadius: 3,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		width: btnSize,
		height: btnSize
	},
	buttonText: {
		textAlign: 'center',
		color: '#fff',
		fontSize: 30
	}
});