import _ from 'lodash';
import React from 'react';
import {
	Text,
	View,
	Animated,
	Easing,
	StatusBar,
	StyleSheet,
	NativeModules
} from 'react-native';

import FontAwesome, { Icons } from 'react-native-fontawesome';

const GameManager = NativeModules.IMCGameManager;

import styles from './../styles';
import i18n from './../i18n';
import MenuButton from './../components/MenuButton';
import Game from './Game';

const menu = [
	{
		title: i18n.play,
		leftIcon: 'play',
		isBig: true,
		action: 'red',
		component: Game
	},
	{
		title: i18n.leaderBoard,
		leftIcon: 'trophy',
		action: 'blue',
		component: 'Leaderboard'
	}
];

export default class Main extends React.Component {
	constructor(props){
		super(props);
		GameManager.rnAuthenticatePlayer();
		this.spinValue = new Animated.Value(0);
	}

	componentDidMount () {
		this.spin()
	}

	spin() {
		this.spinValue.setValue(0);
		Animated.timing(
			this.spinValue,
			{
				toValue: 4,
				duration: 12000,
				easing: Easing.linear
			}
		).start(() => this.spin())
	}

	goToScreen(item) {
		if (item.component === 'Leaderboard') {
			GameManager.rnShowLeaderboard();
			return;
		}
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
		const color = this.spinValue.interpolate({
			inputRange: [0, 1, 2, 3, 4],
			outputRange: ['#76ab9e', '#eb4b4b', '#eba554', '#57454b', '#74ab76']
		});

		return (
			<View style={styles.container}>
				<StatusBar hidden={true}/>
				<Animated.Text style={[localStyles.logo, {color}]}>
					<FontAwesome>{Icons['calculator']}</FontAwesome>
				</Animated.Text>
				<Animated.Text style={[localStyles.logoText, {color}]}>
					{i18n.appName}
				</Animated.Text>
				<View style={{alignItems: 'center'}}>{this._renderMenu()}</View>
			</View>
		);
	}
}


const localStyles = StyleSheet.create({
	menuButton: {
		marginBottom: 10
	},
	logo: {
		alignItems: 'center', 
		color: '#fff',
		marginBottom: 5,
		fontSize: 128
	},
	logoText: {
		fontSize: 30,
		marginBottom: 40,
	}
});
