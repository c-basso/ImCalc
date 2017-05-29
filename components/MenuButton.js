import _ from 'lodash';
import React from 'react';
import {
	Text,
	View,
	TouchableHighlight,
	StyleSheet,
	Dimensions
} from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';

const {width} = Dimensions.get('window');
const correct = width === 320 ? 20 : 40;

export default class extends React.Component {
	_renderLeftIcon() {
		if (this.props.leftIcon) {
			const space = this.props.title ? '  ' : '';
			return (
				<Text>
					<FontAwesome>{Icons[this.props.leftIcon]}</FontAwesome>{space}
				</Text>
			);
		}
		return null;
	}

	render() {
		const modWrap = this.props.isBig
			? {}
			: {};

		const modText = this.props.isBig
			? {fontSize: 28, paddingVertical: 8}
			: {};

		let action = {};

		switch (this.props.action) {
			case 'blue': {
				action = {
					backgroundColor: '#76ab9e',
					borderColor: '#76ab9e',
				};
				break;
			}
			case 'red': {
				action = {
					backgroundColor: '#eb4b4b',
					borderColor: '#eb4b4b'
				};
				break;
			}
			case 'yellow': {
				action = {
					backgroundColor: '#eba554',
					borderColor: '#eba554'
				};
				break;
			}

			default: {
				break;
			}
		}

		const width = this.props.width ? {width: this.props.width} : {};
		const title = this.props.title ? this.props.title : '';

		if (this.props.isDisable) {
			return (
				<View style={[
						styles.menuButton,
						modWrap,
						{borderColor: '#777'},
						width
					]}>
					<Text style={[
						styles.menuButtonText,
						modText,
						{color: '#777'}
						]}>
						{this._renderLeftIcon()}
						{title}
					</Text>
				</View>
			);
		}

		return (
			<TouchableHighlight style={[
				styles.menuButton,
				modWrap,
				action,
				width
				]} onPress={this.props.onPress}>
				<Text style={[
					styles.menuButtonText,
					modText
				]}>
					{this._renderLeftIcon()}
					{title}
				</Text>
			</TouchableHighlight>
		);
	}
}

const styles = StyleSheet.create({
	menuButton: {
		borderStyle: 'solid',
		backgroundColor: 'transparent',
		borderColor: '#fff',
		borderRadius: 3,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		width: width - correct,
		paddingVertical: 6
	},
	menuButtonText: {
		textAlign: 'center',
		color: '#fff',
		fontSize: 20
	}
});