import _ from 'lodash';
import React from 'react';
import {
	Text,
	View,
	StatusBar,
	StyleSheet,
	Dimensions,
	AsyncStorage
} from 'react-native';

import FontAwesome, { Icons } from 'react-native-fontawesome';
import { AdMobRewarded } from 'react-native-admob';

import styles from './../styles';
import ModalBox from './../components/ModalBox';
import MenuButton from './../components/MenuButton';
import GameButton from './../components/GameButton';
import ProgressBar from './../components/ProgressBar';

const {width} = Dimensions.get('window');
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const BUTTONS_COUNT = 14;

const i18n = {
	scoreDesc: 'Очки',
	targetDesc: 'Сумма каких\nдвух чисел равна',
	bestScoreDesc: 'Рекорд',
	youLose: 'Вы проиграли',
};

export default class extends React.Component {
	constructor(props) {
		super(props);

		const lvlIncrement = 0;
		const lastTarget = 0;

		const level = this._generateLevel(lvlIncrement, lastTarget);

		this.state = {
			plusTime: 4,
			hasAd: false,
			money: 0,
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

	next(isRestart = false) {
		this.addTime();

		const lastTarget = this.state.target;
		let lvlIncrement = this.state.lvlIncrement;
		const level = this._generateLevel(lvlIncrement, lastTarget);
		const target = level.target;
		const numbers = this._generateNumbers(level);

		const score = !isRestart ? this.state.score + lastTarget : 0;
		const bestScore = score > this.state.bestScore 
			? score
			: this.state.bestScore;

		if (bestScore > this.state.bestScore) {
			AsyncStorage.setItem('bestScore', bestScore.toString());
		}

		lvlIncrement++;

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
			score: 0,
			progress: 1,
			plusTime: 4,
			gameOver: false,
			lvlIncrement: 0,
			selected: []
		});
		setTimeout(() => {
			this.next(true);
			this.startTiming();
		}, 250);
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
			this.setState({
				plusTime: plusTime - 1
			});
		}
	}

	_generateLevel(lvl, lastTarget) {
		lvl = lvl < 3 ? 2 : Math.ceil(lvl / 3);

		const min = Math.min(lvl, 10);
		const max = lvl * 4;

		let left = getRandomInt(min, max);
		let right = getRandomInt(min, max);

		while (lastTarget == (left + right)) {
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
			.repeat(BUTTONS_COUNT)
			.split('')
			.map(() => this._getNum(level))
			.concat([level.left, level.right]);

		return _.map(_.shuffle(numbers), (value, index) => {
			return {
				index,
				value,
				status: 'inited',
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

		_.map(selected, (item) => {
			numbers[item.index].status = status;
		});

		this.setState({
			numbers,
			selected: status !== 'pressed' ? [] : selected
		});

		if (status === 'success') {
			this.stopTiming();
			setTimeout(() => {
				this.next();
				this.startTiming();
			}, 500);
		} 

		if (status === 'error'){
			this.stopTiming();
			AdMobRewarded.requestAd((error) => {
				if (error) {
					this.setState({hasAd: false});
				}
			});
			setTimeout(() => {
				this.setState({gameOver: true});
			}, 500);
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
		});

		AdMobRewarded.addEventListener('rewardedVideoDidLoad', () => {
			this.setState({hasAd: true});
		});
		AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', (error) => {
			console.log('rewardedVideoDidFailToLoad', error);
		});
		AdMobRewarded.addEventListener('rewardedVideoDidOpen', () => {
			console.log('rewardedVideoDidOpen')
		});
		AdMobRewarded.addEventListener('rewardedVideoDidClose', () => {
			console.log('rewardedVideoDidClose');
			this.setState({hasAd: false});
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
		AdMobRewarded.showAd((error) => {
			if (error) {
				console.log(error)
				this.setState({hasAd: false});
			}
		});
	}

	startTiming() {
		const interval = setInterval(() => {
			this.setState({progress: this.state.progress - 0.015});
			if (this.state.progress <= 0) {
				clearInterval(interval);
				this.setState({
					interval: undefined, 
					gameOver: true
				});
			}
		}, 200);

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
						title={'Заново'} 
						leftIcon={'refresh'} 
						onPress={() => this.restartGame()}/>
				</View>
				<View style={[{marginBottom: 10}]}>
					<MenuButton 
						action={'red'}
						title={'Продолжить за 1 $'} 
						onPress={() => this.restartGame()}/>
				</View>
				<View style={[{marginBottom: 10}]}>
					<MenuButton 
						isDisable={!this.state.hasAd}
						action={'yellow'}
						title={'Посмотреть рекламу'} 
						onPress={() => this.showRewarded()}/>
				</View>
			</View>
		);
	}

	render() {

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
							<Text style={localStyles.scoreDesc}>{i18n.bestScoreDesc.toUpperCase()}</Text>
							<Text style={localStyles.score}>{this.state.bestScore}</Text>
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
							title={`Время (${this.state.plusTime})`}
							leftIcon={'plus'}
							onPress={() => this.plusTime()}/>
					</View>
				</View>

				<ModalBox
					isOpen={this.state.gameOver}
					style={[localStyles.modal]}>
					<View style={localStyles.h1}>
						<Text style={localStyles.h1Text}>{i18n.youLose}</Text>
					</View>
					<View></View>
					{this._renderGameOverButtons()}
				</ModalBox>
			</View>
		);
	}
}


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
		fontSize: 52,
		color: '#fff'
	},
	targetDesc: {
		textAlign: 'center',
		fontSize: 12,
		marginBottom: 6,
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
		marginTop: 20
	},
	headerCol: {
		flex: 1,
		alignItems: 'center'
	},
	modal: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#252f33',
		zIndex: 10
	},
	h1: {
		marginBottom: 40
	},
	h1Text: {
		fontSize: 42,
		color: '#fff'
	}
});
