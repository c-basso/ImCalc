import _ from 'lodash';
import React from 'react';
import {
	Text,
	View,
	Share,
	StatusBar,
	StyleSheet,
	Dimensions,
	Linking,
	NativeModules,
	AsyncStorage
} from 'react-native';

const GameManager = NativeModules.IMCGameManager;
const reactMixin = require('react-mixin');

import FontAwesome, { Icons } from 'react-native-fontawesome';
import TimerMixin from 'react-timer-mixin';
import { AdMobRewarded } from 'react-native-admob';

import styles from './../styles';
import ModalBox from './../components/ModalBox';
import MenuButton from './../components/MenuButton';
import GameButton from './../components/GameButton';
import ProgressBar from './../components/ProgressBar';
import i18n from './../i18n';

const {width} = Dimensions.get('window');
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const BUTTONS_COUNT = 16;
const SUCCESS_TIME = 500;
const ERROR_TIME = 500;
const RESTART_TIME = 500;
const INTERVAL_TIME = 200;

export default class Game extends React.Component {
	_shareText: Function;
	_showResult: Function;

	constructor(props) {
		super(props);

		this._shareText = this._shareText.bind(this);
		this._showResult = this._showResult.bind(this);

		const lvlIncrement = 0;
		const lastTarget = 0;

		const level = this._generateLevel(lvlIncrement, lastTarget);

		this.state = {
			shareResult: '',
			rewardedAmountTaked: false,
			continueAllowed: false,
			plusTime: 4,
			hasAd: false,
			continueCount: 0,
			interval: undefined,
			gameOver: false,
			score: 0,
			bestScore: 0,
			progress: 1,
			selected: [],
			target: level.target,
			lvlIncrement,
			numbers: this._generateNumbers(level)
		};
	}

	next(options) {
		const params = options || {};
		const isRestart = !!params.isRestart;
		const isContinue = !!params.isContinue;

		this.addTime();

		const lastTarget = this.state.target;
		let lvlIncrement = this.state.lvlIncrement;

		const level = this._generateLevel(lvlIncrement, lastTarget);
		const target = level.target;

		const numbers = this._generateNumbers(level);

		let score = this.state.score + lastTarget;

		if (isRestart) {
			score = 0;
		}

		if (isContinue) {
			score = this.state.score;
		}
		
		const bestScore = score > this.state.bestScore 
			? score
			: this.state.bestScore;

		if (bestScore > this.state.bestScore) {
			GameManager.rnReportScore(parseInt(bestScore));
			AsyncStorage.setItem('bestScore', bestScore.toString());
		}

		if (!isContinue && !isRestart) {
			lvlIncrement++;
		}

		this.setState({
			score,
			target,
			numbers,
			bestScore,
			lvlIncrement
		});
	}

	restartGame() {
		this.setState({
			continueCount: 0,
			rewardedAmountTaked: false,
			continueAllowed: false,
			score: 0,
			progress: 1,
			plusTime: 4,
			gameOver: false,
			lvlIncrement: 0,
			selected: []
		});

		this.setTimeout(() => {
			this.next({isRestart: true});
			this.startTiming();
		}, RESTART_TIME);
	}

	continueGame() {
		this.setState({
			continueCount: this.state.continueCount + 1,
			rewardedAmountTaked: false,
			continueAllowed: false,
			progress: 1,
			plusTime: 4,
			gameOver: false,
			selected: []
		});

		this.setTimeout(() => {
			this.next({isContinue: true});
			this.startTiming();
		}, RESTART_TIME);
	}

	addTime() {
		const addon = this.state.progress > 0.4 ? 0.3 : getRandomInt(3, 6) * 0.1;
		let progress = this.state.progress + addon;
		progress = progress > 1 ? 1 : progress;

		this.setState({progress});
	} 

	plusTime() {
		const plusTime = this.state.plusTime;

		if (plusTime > 0) {
			this.addTime();
			this.setState({plusTime: plusTime - 1});
		}
	}

	_generateLevel(lvl, lastTarget) {
		lvl = lvl < 3 ? 2 : Math.ceil(lvl / 3);

		const min = Math.min(lvl, 10);
		const max = lvl * 4;

		let left = getRandomInt(min, max);
		let right = getRandomInt(min, max);

		while (lastTarget === (left + right)) {
			left = getRandomInt(min, max);
			right = getRandomInt(min, max);
		}

		const target = left + right;

		return {
			left,
			right,
			target,
			min,
			max
		};
	}

	_getNum(lvl) {
		const num = getRandomInt(lvl.min, lvl.max * 1.8);
		if (num === lvl.target) {
			return this._getNum(lvl);
		}
		return num;
	}

	_generateNumbers(level) {
		const numbers = '0'
			.repeat(BUTTONS_COUNT - 2)
			.split('')
			.map(() => this._getNum(level))
			.concat([level.left, level.right]);

		return _.map(_.shuffle(numbers), (value, index) => {
			return {
				index,
				value,
				status: 'inited',
				reInit: true,
				onPress: this.onPress.bind(this, index)
			}
		});
	}

	onPress(index) {
		const gameOver = this.state.gameOver;

		if (gameOver) {
			return;
		}

		let status = 'pressed';
		let selected = this.state.selected;

		const target = this.state.target;
		const numbers = this.state.numbers;

		const current = numbers[index];
		const last = _.head(selected);

		if (selected.length < 2) {
			selected.push(current);
		}

		if (!last) {
			status = 'pressed';
		} else {
			if (last.index === current.index) {
				status = 'inited';
			} else {
				const sum = _.reduce(selected, 
					(sum, item) => item.value + sum, 0);

				status = target === sum 
					? 'success'
					: 'error';
			}
		}

		_.forEach(selected, (item) => numbers[item.index].status = status);

		this.setState({
			numbers,
			selected: status !== 'pressed' ? [] : selected
		});

		if (status === 'success') {
			this.stopTiming();
			this.setTimeout(() => {
				this.next();
				this.startTiming();
			}, SUCCESS_TIME);
		} 

		if (status === 'error'){
			this.stopTiming();
			AdMobRewarded.requestAd((error) => error && this.setState({hasAd: false}));
			this.setTimeout(() => this.setState({gameOver: true}), ERROR_TIME);
		}
	}

	_getRowValues(from) {
		return _(this.state.numbers).slice(from).take(4).value();
	}

	initAdMob() {
		const onHasAd = (error) => {
			if (error) {
				console.log(error)
				this.setState({hasAd: false});
			}
		}

		AdMobRewarded.setTestDeviceID('EMULATOR');
		AdMobRewarded.setAdUnitID('ca-app-pub-1162713371969361/7767508734');

		AdMobRewarded.addEventListener('rewardedVideoDidRewardUser', (type, amount) => {
			console.log('rewardedVideoDidRewardUser', type, amount);
			this.setState({rewardedAmountTaked: true});
		});

		AdMobRewarded.addEventListener('rewardedVideoDidLoad', () => {
			this.setState({hasAd: true});
		});
		AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', (error) => {
			console.log('rewardedVideoDidFailToLoad', error);
			this.setState({hasAd: false});
		});
		AdMobRewarded.addEventListener('rewardedVideoDidOpen', () => {
			console.log('rewardedVideoDidOpen');
			this.setState({hasAd: true});
		});
		AdMobRewarded.addEventListener('rewardedVideoDidClose', () => {
			console.log('rewardedVideoDidClose');
			this.setState({hasAd: false});
			if (this.state.rewardedAmountTaked) {
				this.setState({continueAllowed: true});
			}
			AdMobRewarded.requestAd(onHasAd);
		});

		AdMobRewarded.addEventListener('rewardedVideoWillLeaveApplication', () => {
			console.log('rewardedVideoWillLeaveApplication');
		});

		AdMobRewarded.requestAd(onHasAd);
	}

	componentDidMount() {
		this.initAdMob();

		AsyncStorage.getItem('bestScore').then((bestScore) => {
			bestScore = parseInt(bestScore) || 0;
			this.setState({bestScore});
		}).done();

		this.startTiming();
	}

	componentWillUnmount() {
		AdMobRewarded.removeAllListeners();
	}

	showRewarded() {
		AdMobRewarded.showAd((error) => error && this.setState({hasAd: false}));
	}

	startTiming() {
		const numbers = _.map(this.state.numbers, (n) => Object.assign({}, n, {reInit: false}));
		this.setState({numbers});

		const interval = this.setInterval(() => {
			this.setState({
				progress: this.state.progress - 0.015,
			});

			if (this.state.progress <= 0) {
				this.clearInterval(interval);
				this.setState({
					interval: undefined, 
					gameOver: true
				});
			}

		}, INTERVAL_TIME);

		this.setState({interval});
	}

	stopTiming() {
		const interval = this.state.interval;
		clearInterval(interval);
		this.setState({interval: undefined});
	}

	_renderButtonsRow(numbers) {
		return _.map(numbers, (item, index) => {
			return (
				<View style={localStyles.gameButton} key={index}>
					<GameButton key={index} index={index} {...item}/>
				</View>
			);
		});
	}

	_renderGameOverButtons() {
		return (
			<View>
				<View style={[{marginBottom: 10}]}>
					<MenuButton 
						action={'blue'}
						isBig={true}
						title={i18n.restartGame} 
						leftIcon={'refresh'} 
						onPress={() => this.restartGame()}/>
				</View>
				<View style={[{marginBottom: 10}]}>
					<MenuButton 
						isDisable={!this.state.hasAd || this.state.continueCount >= 2}
						action={'yellow'}
						title={i18n.showRewarded} 
						onPress={() => this.showRewarded()}
						/>
				</View>
			</View>
		);
	}

	_share() {
		this._shareText();
	}

	_shareText() {
		Share.share({
			message: i18n.shareMessage.replace('{bestScore}', this.state.bestScore),
			url: this._getAppLink(),
			title: i18n.appName
		}, 
		{
			dialogTitle: i18n.shareDialogTitle,
			excludedActivityTypes: [
				'com.apple.UIKit.activity.Message',
				'com.apple.UIKit.activity.PostToFacebook',
				'com.apple.UIKit.activity.PostToTwitter'
			],
			tintColor: 'green'
		}
		)
		.then(this._showResult)
		.catch((error) => this.setState({shareResult: 'error: ' + error.message}));
	}

	_showResult(result) {
		if (result.action === Share.sharedAction) {
			if (result.activityType) {
				this.setState({shareResult: 'shared with an activityType: ' + result.activityType});
			} else {
				this.setState({shareResult: 'shared'});
			}
		} else if (result.action === Share.dismissedAction) {
			this.setState({shareResult: 'dismissed'});
		}
	}

	_getAppLink() {
		return `http://itunes.apple.com/${i18n.country}/app/imcalc/id1239180596?mt=8`;
	}

	_vote() {
		const link = this._getAppLink();

		Linking.canOpenURL(link)
			.then((supported) => {
				supported && Linking.openURL(link);
			}, (err) => console.log(err));
	}

	_renderModal() {
		return (
			<ModalBox
				isOpen={this.state.gameOver}
				style={[localStyles.modal]}>
				<View style={localStyles.h1}>
					<Text style={localStyles.h1Text}>{i18n.youLose}</Text>
				</View>
				<View style={localStyles.result}>
					<View style={localStyles.resultCol}>
						<Text style={localStyles.resultDesc}>{i18n.scoreDesc.toUpperCase()}</Text>
						<Text style={localStyles.resultValue}>{this.state.score}</Text>
					</View>
					<View style={localStyles.resultCol}>
						<Text style={localStyles.resultDesc}>{i18n.levelDesc.toUpperCase()}</Text>
						<Text style={localStyles.resultValue}>{this.state.lvlIncrement + 1}</Text>
					</View>
					
					<View style={localStyles.resultCol}>
						<Text style={localStyles.resultDesc}>{i18n.bestScoreDesc.toUpperCase()}</Text>
						<Text style={localStyles.resultValue}>{this.state.bestScore}</Text>
					</View>
				</View>
				{this._renderGameOverButtons()}

				<View style={{
					flex: 0,
					width: 140,
					flexDirection: 'row', 
					marginTop: 20,
					justifyContent: 'space-between'
				}}>
					<MenuButton 
						action={'red'}
						width={38}
						leftIcon={'trophy'} 
						onPress={() => GameManager.rnShowLeaderboard()}/>

					<MenuButton 
						action={'blue'}
						width={38}
						leftIcon={'share'} 
						onPress={() => this._share()}/>

					<MenuButton 
						action={'green'}
						width={38}
						leftIcon={'star'} 
						onPress={() => this._vote()}/>
				</View>
			</ModalBox>
		);
	}

	render() {

		if (this.state.continueAllowed) {
			this.continueGame();
		}

		return (
			<View style={styles.container}>
				<StatusBar hidden={true}/>
				<View style={{
					justifyContent: 'flex-start', 
					alignItems: 'center',
					flex: 1
				}}>
					<View style={localStyles.header}>
						<View style={localStyles.headerCol}>
							<Text style={localStyles.scoreDesc}>{i18n.scoreDesc.toUpperCase()}</Text>
							<Text style={localStyles.score}>{this.state.score}</Text>
						</View>
						<View style={localStyles.headerCol}>
							<Text style={localStyles.targetDesc}>{i18n.targetDesc.toUpperCase()}</Text>
							<Text style={localStyles.target}>{this.state.target}</Text>
						</View>
						<View style={localStyles.headerCol}>
							<Text style={localStyles.scoreDesc}>{i18n.levelDesc.toUpperCase()}</Text>
							<Text style={localStyles.score}>{this.state.lvlIncrement + 1}</Text>
						</View>
					</View>
					<View>
						<ProgressBar 
							style={localStyles.progress}
							progress={this.state.progress}/>
					</View>
					<View style={localStyles.row}>{this._renderButtonsRow(this._getRowValues(0))}</View>
					<View style={localStyles.row}>{this._renderButtonsRow(this._getRowValues(4))}</View>
					<View style={localStyles.row}>{this._renderButtonsRow(this._getRowValues(8))}</View>
					<View style={localStyles.row}>{this._renderButtonsRow(this._getRowValues(12))}</View>

					<View style={{marginTop: 20}}>
						<MenuButton 
							isDisable={this.state.plusTime === 0}
							title={`${i18n.addTime} (${this.state.plusTime})`}
							leftIcon={'plus'}
							onPress={() => this.plusTime()}/>
					</View>
				</View>

				{this._renderModal()}
			</View>
		);
	}
}

reactMixin(Game.prototype, TimerMixin);


const localStyles = StyleSheet.create({
	gameButton: {
		margin: width === 320 ? 2 : 4
	},
	row: {
		justifyContent: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	progress: {},
	target: {
		fontSize: width === 320 ? 48 : 52,
		color: '#fff',
		paddingTop: 10
	},
	targetDesc: {
		textAlign: 'center',
		fontSize: width === 320 ? 10 : 12,
		color: '#fff'
	},
	score: {
		fontSize: 20,
		color: '#fff'
	},
	scoreDesc: {
		fontSize: 10,
		color: '#eee'
	},
	header: {
		flex: 0, 
		flexDirection: 'row',
		marginTop: 20,
		marginBottom: 20,
	},
	headerCol: {
		flex: 1,
		alignItems: 'center'
	},
	result: {
		flex: 0, 
		flexDirection: 'row',
		marginBottom: 40,
		width: 240
	},
	resultCol: {
		flex: 1,
		alignItems: 'center'
	},
	resultValue: {
		fontSize: 20,
		color: '#fff'
	},
	resultDesc: {
		fontSize: 10,
		color: '#eee'
	},
	modal: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#2c3e50',
		zIndex: 10
	},
	h1: {
		marginBottom: 40
	},
	h1Text: {
		fontSize: 36,
		color: '#fff'
	}
});
