import React from "react";
import { slide as Menu } from "react-burger-menu";

class Sidebar extends React.Component {
    aboutExpandFromSidebar = () => {
        this.props.closeMenu();
        this.props.aboutExpand();
    }

    handleDropdownClick = (item) => {
        this.props.closeMenu();
        this.props.handleDropdownClick(item, null);
    }

    render() {
        return (
            <Menu {...this.props}>
                <div className="menu-categories">
                    <div className="menu-cat-col">
                        <div className="menu-item menu-cat-head">
                            Electronics
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Smartphones')}>
                            Smartphones
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Smart watch')}>
                            Smart Watch
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('TV')}>
                            TV
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Earphones')}>
                            Earphones
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Laptops')}>
                            Laptops
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Gaming consoles')}>
                            Gaming Consoles
                        </div>
                        <div className="menu-item menu-cat-head">
                            Men
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('T shirts for men')}>
                            T-Shirts
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Shirts for men')}>
                            Shirts
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Ppants for men')}>
                            Pants
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Jeans for men')}>
                            Jeans
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Shoes for men')}>
                            Shoes
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Wallets')}>
                            Wallets
                        </div>
                    </div>
                    <div className="menu-cat-col">
                        <div className="menu-item menu-cat-head">
                            Appliances
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Washing machines')}>
                            Washing Machine
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Air conditioners')}>
                            Air Conditioners
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Refrigerators')}>
                            Refrigerators
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Microwave ovens')}>
                            Microwave Ovens
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Grinders')}>
                            Grinders
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Dish washers')}>
                            Dish Washers
                        </div>
                        <div className="menu-item menu-cat-head">
                            Women
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Sarees')}>
                            Sarees
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Tops for women')}>
                            Tops
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Jeans for women')}>
                            Jeans
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Shoes for women')}>
                            Shoes
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Earrings')}>
                            Earrings
                        </div>
                        <div className="menu-item menu-cat" onClick={() => this.handleDropdownClick('Handbags')}>
                            Handbags
                        </div>
                    </div>
                    <hr className="menu-hr" />
                    <div className="menu-item menu-about" onClick={this.aboutExpandFromSidebar}>
                        About
                    </div>
                </div>
            </Menu>
        );
    }
}

export default Sidebar;