const DEFAULT_SPACING = 10;

export enum LayoutDirection {
    Vertical, Horizontal
};

export class TiledLayout extends createjs.Container {
    direction: LayoutDirection;
    spacing: number;
    center_elements: boolean;

    constructor(direction: LayoutDirection, spacing: number, center_elements: boolean = false) {
        super();

        this.direction = direction;
        this.spacing = spacing;
        this.center_elements = center_elements;
    }

    apply_centering() {
        // TODO: Implement me!
    }

    addItem(item: createjs.DisplayObject, spacing: number = 0) {
        if (this.numChildren > 0) {
            if (this.direction === LayoutDirection.Horizontal) {
                item.x += super.getBounds().width + this.spacing + spacing;
            } else {
                item.y += super.getBounds().height + this.spacing + spacing;
            }
        }
        super.addChild(item);
    }
};