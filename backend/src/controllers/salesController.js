class SalesController {
    constructor(salesModel) {
        this.salesModel = salesModel;
    }

    async createSale(req, res) {
        try {
            const saleData = req.body;
            const newSale = await this.salesModel.create(saleData);
            res.status(201).json(newSale);
        } catch (error) {
            res.status(500).json({ message: 'Error creating sale', error });
        }
    }

    async getSales(req, res) {
        try {
            const sales = await this.salesModel.find();
            res.status(200).json(sales);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving sales', error });
        }
    }

    async updateSale(req, res) {
        try {
            const { id } = req.params;
            const updatedSale = await this.salesModel.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedSale) {
                return res.status(404).json({ message: 'Sale not found' });
            }
            res.status(200).json(updatedSale);
        } catch (error) {
            res.status(500).json({ message: 'Error updating sale', error });
        }
    }
}

module.exports = SalesController;