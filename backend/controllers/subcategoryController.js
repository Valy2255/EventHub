export const getAllSubcategories = async (req, res, next) => {
    try {
      const subcategories = await Subcategory.getAll(req.query.categoryId);
      res.json({ subcategories });
    } catch (error) {
      next(error);
    }
  };
  
  export const getSubcategoryById = async (req, res, next) => {
    try {
      const subcategory = await Subcategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ error: 'Subcategoria nu a fost găsită' });
      }
      res.json({ subcategory });
    } catch (error) {
      next(error);
    }
  };
  
  export const createSubcategory = async (req, res, next) => {
    try {
      const { category_id, name, slug, description } = req.body;
      
      if (!category_id || !name || !slug) {
        return res.status(400).json({ error: 'ID-ul categoriei, numele și slug-ul sunt obligatorii' });
      }
      
      const subcategory = await Subcategory.create({ category_id, name, slug, description });
      res.status(201).json({ subcategory });
    } catch (error) {
      next(error);
    }
  };
  
  export const updateSubcategory = async (req, res, next) => {
    try {
      const { category_id, name, slug, description, active } = req.body;
      
      if (!category_id || !name || !slug) {
        return res.status(400).json({ error: 'ID-ul categoriei, numele și slug-ul sunt obligatorii' });
      }
      
      const subcategory = await Subcategory.update(req.params.id, { 
        category_id, name, slug, description, active: active !== undefined ? active : true 
      });
      
      if (!subcategory) {
        return res.status(404).json({ error: 'Subcategoria nu a fost găsită' });
      }
      
      res.json({ subcategory });
    } catch (error) {
      next(error);
    }
  };
  
  export const deleteSubcategory = async (req, res, next) => {
    try {
      const subcategory = await Subcategory.remove(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ error: 'Subcategoria nu a fost găsită' });
      }
      
      res.json({ message: 'Subcategoria a fost ștearsă cu succes' });
    } catch (error) {
      next(error);
    }
  };