odoo.define('pos_kitchen_screen_extended.kitchen_screen',function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var rpc = require('pos.rpc');
    var qweb = core.qweb;
    var PopupWidget = require('point_of_sale.popups');
    var chrome = require('point_of_sale.chrome');

    chrome.Chrome.include({
        init: function() {
            var self = this;
            this._super.apply(this, arguments);
            this.pos.ready.done(function(){
                self.gui.screen_instances.products.order_widget.update_count_booked_orders()
            });
        },
    });

    var button_go_sale_orders_screen = screens.ActionButtonWidget.extend({
        template: 'button_go_sale_orders_screen',
        init: function (parent, options) {
            this._super(parent, options);
        },
        button_click: function () {
            this.pos.gui.screen_instances["pos_orders_screen"].refresh_screen();
            this.gui.show_screen('pos_orders_screen', {booked_order: true});
        }
    });
    screens.define_action_button({
        'name': 'button_go_sale_orders_screen',
        'widget': button_go_sale_orders_screen,
        'condition': function () {
            return this.pos.config.send_to_kitchen;
        }
    });

    var ButtonCreateBookingOrder = screens.ActionButtonWidget.extend({
        template: 'button_booking_order',
        button_click: function () {
            var self = this;
            var order = this.pos.get_order();
            order.initialize_validation_date();
            if(order.get_client()){
                this.gui.show_popup('PopupCreateBookingOrderKitchen', {
                    title: 'Create book order',
                    order: order,
                    client: order.get_client(),
                });
            }
        }
    });

    screens.define_action_button({
        'name': 'button_create_booking_order',
        'widget': ButtonCreateBookingOrder,
        'condition': function () {
            return this.pos.config.send_to_kitchen;
        }
    });

    var ButtonComplaintFeedbackOrder = screens.ActionButtonWidget.extend({
        template: 'button_complaint_feedback_order',
        button_click: function () {
            var self = this;
            this.gui.show_popup('PopupComplaintFeedbackOrder', {
                title: 'Complain / Feedback',
            });
        }
    });

    screens.define_action_button({
        'name': 'button_complaint_feedback_order',
        'widget': ButtonComplaintFeedbackOrder,
        'condition': function () {
            return this.pos.config.send_to_kitchen;
        }
    });
});