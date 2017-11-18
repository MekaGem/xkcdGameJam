const DEFAULT_SPACING = 10;

export enum LayoutDirection {
    Vertical, Horizontal
};

export class TiledLayout extends createjs.Container {
    direction: LayoutDirection;
    spacing: number;

    constructor(direction: LayoutDirection, spacing: number) {
        super();

        this.direction = direction;
        this.spacing = spacing;
    }

    addItem(item: createjs.DisplayObject) {
        if (this.numChildren > 0) {
            if (this.direction = LayoutDirection.Horizontal) {
                item.x += super.getBounds().width + this.spacing;
            } else {
                item.y += super.getBounds().height + this.spacing;
            }
        }
        super.addChild(item);
    }
};