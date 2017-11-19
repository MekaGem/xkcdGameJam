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
        console.log(super.getBounds());
        let width = super.getBounds().width;
        let height = super.getBounds().height;
        for (let i = 0; i < this.numChildren; ++i) {
            let child = super.getChildAt(i);
            console.log("Child x: ", child.x);
            console.log("Child y: ", child.y);
            console.log("Child bounds: ", child.getBounds());
            if (this.direction === LayoutDirection.Horizontal) {
                // TODO: Implement me!
            } else {
                // TODO: Implement me!
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