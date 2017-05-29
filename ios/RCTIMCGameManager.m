#import "RCTIMCGameManager.h"
#import <GameKit/GameKit.h>

#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#else
#import "RCTBridge.h"
#endif

#import "AppDelegate.h"

#define LEADERBOARD_ID          @"imcalc.highscore"
#define ACHIEVEMENT_NOVICE_ID   @"imcalc.novice"
#define ACHIEVEMENT_INT_ID      @"imcalc.intermediate"
#define ACHIEVEMENT_EXPERT_ID   @"imcalc.expert"

@interface RCTIMCGameManager()

@property (nonatomic, strong) UIViewController *presentationController;

@end

@implementation RCTIMCGameManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(rnReportScore:(NSInteger)score)
{
  [[RCTIMCGameManager sharedManager] reportScore: score];
}


RCT_EXPORT_METHOD(rnAuthenticatePlayer)
{
  [[RCTIMCGameManager sharedManager] authenticatePlayer];
}

RCT_EXPORT_METHOD(rnShowLeaderboard)
{
  [[RCTIMCGameManager sharedManager] showLeaderboard];
}

#pragma mark Singelton

+ (instancetype)sharedManager {
  static RCTIMCGameManager *sharedManager;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedManager = [[RCTIMCGameManager alloc] init];
  });
  return sharedManager;
}

#pragma mark Initialization

- (id)init {
  self = [super init];
  if (self) {
    [self authenticatePlayer];
    AppDelegate *del = (AppDelegate*)[[UIApplication sharedApplication] delegate];
    self.presentationController = del.window.rootViewController;
  }
  return self;
}

#pragma mark Player Authentication

- (void)authenticatePlayer {
  GKLocalPlayer *localPlayer = [GKLocalPlayer localPlayer];
  
  [localPlayer setAuthenticateHandler:^(UIViewController *viewController, NSError *error) {
    if (viewController != nil) {
      [self.presentationController presentViewController:viewController animated:YES completion:nil];
    } else if ([GKLocalPlayer localPlayer].authenticated) {
      NSLog(@"Player successfully authenticated");
    } else if (error) {
      NSLog(@"Game Center authentication error: %@", error);
    }
  }];
}

#pragma mark Leaderboard and Achievement handling

- (void)showLeaderboard{
  GKGameCenterViewController *gcViewController = [[GKGameCenterViewController alloc] init];
  gcViewController.gameCenterDelegate = self;
  gcViewController.viewState = GKGameCenterViewControllerStateLeaderboards;
  gcViewController.leaderboardIdentifier = LEADERBOARD_ID;
  
  [self.presentationController presentViewController:gcViewController animated:YES completion:nil];
}

- (void)reportScore:(NSInteger)score {
  GKScore *gScore = [[GKScore alloc] initWithLeaderboardIdentifier:LEADERBOARD_ID];
  gScore.value = score;
  gScore.context = 0;
  
  [GKScore reportScores:@[gScore] withCompletionHandler:^(NSError *error) {
    if (!error) {
      NSLog(@"Score reported successfully!");
      
      // score reported, so lets see if it unlocked any achievements
      NSMutableArray *achievements = [[NSMutableArray alloc] init];
      
      // if the player hit an achievement threshold, create the
      // achievement using the ID and add it to the array
      if(score >= 100) {
        GKAchievement *noviceAchievement = [[GKAchievement alloc] initWithIdentifier:ACHIEVEMENT_NOVICE_ID];
        noviceAchievement.percentComplete = 100;
        [achievements addObject:noviceAchievement];
      }
      
      if(score >= 150) {
        GKAchievement *intAchievement = [[GKAchievement alloc] initWithIdentifier:ACHIEVEMENT_INT_ID];
        intAchievement.percentComplete = 100;
        [achievements addObject:intAchievement];
      }
      
      if(score >= 200) {
        GKAchievement *expertAchievement = [[GKAchievement alloc] initWithIdentifier:ACHIEVEMENT_EXPERT_ID];
        expertAchievement.percentComplete = 100;
        [achievements addObject:expertAchievement];
      }
      
      // tell the Game Center to mark the array of achievements as completed
      [GKAchievement reportAchievements:achievements withCompletionHandler:^(NSError *error) {
        if (error != nil) {
          NSLog(@"err %@", [error localizedDescription]);
        }
      }];
    }
    else {
      NSLog(@"Unable to report score");
    }
  }];
}

#pragma mark GameKit Delegate Methods

- (void)gameCenterViewControllerDidFinish:(GKGameCenterViewController *)gameCenterViewController {
  [gameCenterViewController dismissViewControllerAnimated:YES completion:nil];
}

@end
