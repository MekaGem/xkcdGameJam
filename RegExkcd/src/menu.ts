import { TiledLayout, LayoutDirection } from "./layout";
import { assets, change_screen, game_screen, stage_width, stage_height } from "./main";

const menu_screen = new TiledLayout(LayoutDirection.Vertical, 50);

export function get_menu_screen() {
    menu_screen.removeAllChildren();

    let bg = new createjs.Sprite(assets.menu_bg_spritesheet);
    bg.scaleX = 0.7;
    bg.scaleY = 0.7;

    let start_button = new createjs.Sprite(assets.menu_button_spritesheet);
    start_button.x = (stage_width - start_button.getBounds().width) / 2;
    start_button.y = (stage_height - start_button.getBounds().height) / 2;

    start_button.addEventListener("click", (event) => {
        change_screen(game_screen);
    });

    menu_screen.addChild(bg);
    menu_screen.addChild(start_button);

    return menu_screen;
}