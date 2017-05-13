import _ from 'lodash';
import React from 'react';
import {
	Text,
	View,
	StatusBar,
	StyleSheet
} from 'react-native';

import styles from './../styles';
import MenuButton from './../components/MenuButton';
import Game from './Game';

const menu = [
	{
		title: 'Играть',
		leftIcon: 'calculator',
		isBig: true,
		action: 'red',
		component: Game
	},
	{
		title: 'Рекорды',
		leftIcon: 'trophy',
		action: 'blue',
		component: ''
	},
	{
		title: 'Об игре',
		action: 'yellow',
		component: ''
	}
]

export default class extends React.Component {
	goToScreen(item) {
		this.props.navigator.push({
			title: item.title,
			index: 1,
			display: true,
			component: item.component
		})
	}

	_renderMenu() {
		return _.map(menu, (item, index) => (
			<View style={localStyles.menuButton} key={index}>
				<MenuButton {...item} onPress={this.goToScreen.bind(this, item)}/>
			</View>
		))
	}

	render() {
		return (
			<View style={styles.container}>
				<StatusBar hidden={true}/>
				<View style={{alignItems: 'center'}}>{this._renderMenu()}</View>
			</View>
		);
	}
}


const localStyles = StyleSheet.create({
	menuButton: {
		marginBottom: 10
	}
});
