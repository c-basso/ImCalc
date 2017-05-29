#if __has_include(<React/RCTViewManager.h>)
#import <React/RCTViewManager.h>
#else
#import "RCTViewManager.h"
#endif

#import <Foundation/Foundation.h>

#import <GameKit/GameKit.h>

@interface RCTIMCGameManager : NSObject <RCTBridgeModule, GKGameCenterControllerDelegate>

/**
 *  Singelton
 *
 *  @return shared instance of self
 */
+ (instancetype)sharedManager;

/**
 *  Makes sure player is authenticated currently
 *  if not, it will present the Game Center login
 *  screen for the user's convenience
 */
- (void)authenticatePlayer;

/**
 *  Presents the Game Center leaderboard UI
 */
- (void)showLeaderboard;

/**
 *  Reports score to Game Center and checks
 *  if any achievements have been unlocked
 *
 *  @param score The user's score
 */
- (void)reportScore:(NSInteger)score;

@end
