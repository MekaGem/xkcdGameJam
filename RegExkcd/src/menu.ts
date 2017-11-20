import { TiledLayout, LayoutDirection } from "./layout";
import { assets, change_screen, game_screen } from "./main";

const menu_screen = new TiledLayout(LayoutDirection.Vertical, 50);

export function get_menu_screen() {
    menu_screen.removeAllChildren();

    let start_button = new createjs.Sprite(assets.menu_button_spritesheet);
    start_button.addEventListener("click", (event) => {
        change_screen(game_screen);
    });

    menu_screen.addChild(start_button);

    return menu_screen;
}