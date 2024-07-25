odoo.define('pos_kitchen_screen_extended.pos',function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var rpc = require('pos.rpc');
    var qweb = core.qweb;
    var PopupWidget = require('point_of_sale.popups');
    var KitchenScreen = require('aspl_pos_kitchen_screen.pos');
    var framework = require('web.framework');
    var rpc = require('web.rpc');

    var PopupComplaintFeedbackOrder = PopupWidget.extend({
        template: 'PopupComplaintFeedbackOrder',
        events: _.extend({}, PopupWidget.prototype.events, {
            'change #order_no': '_onChangeOrderNo'
        }),
        _onChangeOrderNo: function(){
            var self = this;
            var order_no = this.$('#order_no').val();
            if(order_no){
                order_no = $.trim(order_no);
                framework.blockUI();
                rpc.query({
                    model: 'pos.order',
                    method: 'search_read',
                    domain : ['|', ['name', '=', order_no], ['ean13', '=', order_no]],
                    fields: ['id', 'partner_id', 'delivery_phone']
                },{async:false}).done(function(result) {
                    if(!result || result.length == 0){
                        self.$('#order_no').addClass('border-dander');

                        self.$el.append("<div class='alert alert-danger custom_alert'>Invalid Order No.</div>");
                        setTimeout(function() {
                            $(".custom_alert").alert('close');
                        }, 2000);
                    } else {
                        if(result[0].partner_id){
                            var partner_id = self.pos.db.get_partner_by_id(result[0].partner_id[0])
                            if(partner_id){
                                self.$('#customer_name').val(partner_id.name);
                                var phone = partner_id.phone || partner_id.mobile;
                                if(result[0].delivery_phone){
                                    phone = result[0].delivery_phone;
                                }
                                self.$('#customer_mobile').val(phone || "");
                            }
                        }
                    }
                    framework.unblockUI();
                });
            }

        },
        click_confirm: function(){
            var order_no = this.$('#order_no').not('.border-dander').val();
            if(!order_no){
                alert("Valid order number is required!");
                return;
            }
            var complaint_info = this.$('#information').val();
            if(!complaint_info){
                alert("Please add Complaint/Feedback.");
                return;
            }
            var reason_for_call = parseInt(this.$('#reason_for_call').val());
            order_no = $.trim(order_no);
            complaint_info = $.trim(complaint_info);
            rpc.query({
                model: 'customer.feedback',
                method: 'create_feedback_from_ui',
                args : [{
                    'order_no': order_no,
                    'feedback': complaint_info,
                    'reason_for_call_id': reason_for_call > 0 ? reason_for_call : false,
                }]
            },{async:false});
            this.gui.close_popup();
        },
    });
    gui.define_popup({
        name: 'PopupComplaintFeedbackOrder',
        widget: PopupComplaintFeedbackOrder
    });

    var PopupCreateBookingOrderKitchen = PopupWidget.extend({ // create booking order
        template: 'popup_create_booking_order_kitchen',
        init: function (parent, options) {
            this._super(parent, options);
        },
        show: function (options) {
            var self = this;
            this._super(options);
            options = options || {}
            this.client = options.client;
            this.$('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD H:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                },
                defaultDate: self.pos.get_order().delivery_date || new Date(),
            });
            this.$(".pos_signature").jSignature();
            this.signed = false;
            this.$(".pos_signature").bind('change', function (e) {
                self.signed = true;
            });
            this.$(".cancel").click(function (e) {
                self.pos.gui.close_popup();
            });
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.cancel').click(function () {
                self.gui.close_popup();
            });
            this.$('.fa-plus').click(function () {
                self.gui.show_popup('partner_address_popup',{
                    'title': _t('Delivery Address'),
                    'body': _t('New Address'),
                    confirm: function(){
                        console.log(">>>>>>>>>confirm")
                    },
                });
            });
            this.$('.class_set_address').click(function () {
                var fields = {};
                self.$('.booking_field').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                var order = self.pos.get_order();
                var location = fields['location'];
                var fields = {};
                self.$('.booking_field').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                if(fields.branch){
                    order.set_pos_branch(parseInt(fields.branch))
                }
                order.delivery_address = fields.delivery_address
                order.delivery_phone = fields.delivery_phone
                order.delivery_date = fields.delivery_date
                order.note = fields.note
                var dom = [
                    ['id', '=', location],
                ];
                self._rpc({
                    model:  'stock.location',
                    method: 'search_read',
                    args: [dom],
                }).then(function(result){
                    if (result){
                        order.set_location(result);
                        self.pos.gui.close_popup();
                        order['draft_booking_order_details'] = fields

                        var location_ids = [];
                        location_ids.push(location)

                        return self.pos._get_stock_on_hand_by_location_ids([], [parseInt(location)]).done(function (datas) {
                            self.pos.db.stock_datas = datas;
                            var products = [];
                            for (var product_id in datas) {
                                var product = self.pos.db.product_by_id[product_id];
                                if (product) {
                                    products.push(product)
                                }
                            }
                            if (products.length) {
                                self.pos.gui.screen_instances["products"].do_update_products_cache(products);
                                self.pos.gui.screen_instances["products_operation"].refresh_screen();
                                self.pos.gui.screen_instances['pos_orders_screen'].refresh_screen();
                            }
                            order['is_delivery'] = true
                            return self.gui.show_popup('dialog', {
                                title: 'Succeed',
                                body: 'Products Screen with display stock available with your stock locations selected',
                                color: 'success'
                            });
                        });
                    }
                });
            });
            this.$('.class_delivery_address').change(function () {
                if (this.value || this.value != ''){
                    var dom = [
                        ['id', '=', this.value],
                    ];
                    rpc.query({
                        model:  'res.partner',
                        method: 'search_read',
                        args: [dom],
                    }).then(function(result){
                        if (result){
                            if (result[0].city){
                                var branch_dom = [
                                    ['district_ids', 'in', result[0].city[0]]
                                ]
                                rpc.query({
                                    model:  'pos.branch',
                                    method: 'search_read',
                                    args: [branch_dom],
                                }).then(function(branch_rec){
                                    if (branch_rec){
                                        if ($('.class_district_branch')){
                                            if($('.class_district_branch').length >= 2){
                                                $('.class_district_branch')[1].value = branch_rec[0].id
                                                $('.class_branch_location')[1].value = branch_rec[0].location_id[0]
                                            }
                                            else{
                                                console.log(">>>>>>>>>>>>length is not more than 2...")
                                            }
                                        }
                                    }
                                })
                            }
                        }
                    });

                }
            });

            this.$('.confirm').click(function () {
                var fields = {};
                var selectedOrder = self.pos.get_order();
                var fields = {};
                self.$('.booking_field').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                if(fields.branch){
                    selectedOrder.set_pos_branch(parseInt(fields.branch))
                }
                selectedOrder.delivery_address = fields.delivery_address
                selectedOrder.delivery_phone = fields.delivery_phone
                selectedOrder.delivery_date = fields.delivery_date
                selectedOrder.note = fields.note
                var currentOrderLines = selectedOrder.get_orderlines();
                var orderLines = [];
                _.each(currentOrderLines,function(item) {
                    return orderLines.push(item.export_as_JSON());
                });
                if (orderLines.length === 0) {
                    return alert ('Please select product !');
                } else {
                    self.pos.push_order(selectedOrder);
                }
                selectedOrder.trigger('change');
            })
        }
    });
    gui.define_popup({
        name: 'PopupCreateBookingOrderKitchen',
        widget: PopupCreateBookingOrderKitchen
    });
});
