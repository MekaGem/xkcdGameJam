const DEFAULT_SPACING = 10;

export enum LayoutDirection {
    Vertical, Horizontal
};

export class TiledLayout extends createjs.Container {
    direction: LayoutDirection;
    spacing: number;
    center_elements: boolean;
    size: number;

    constructor(direction: LayoutDirection, spacing: number, center_elements: boolean = false, size: number = 0) {
        super();

        this.direction = direction;
        this.spacing = spacing;
        this.center_elements = center_elements;
        this.size = size;
    }

    apply_centering() {
        for (let child of this.children) {
            if (this.direction === LayoutDirection.Horizontal) {
                child.y += (this.size - child.getBounds().height) / 2;
            } else {
                child.x += (this.size - child.getBounds().width) / 2;
            }
        }
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
        // TODO: Finish implementing this.
        // if (this.center_elements) {
        //     this.apply_centering();
        // }
    }
};