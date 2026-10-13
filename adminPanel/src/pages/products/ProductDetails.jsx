import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { fetchProductById } from "../../services/product.service";
import { fetchCategories } from "../../services/category.service";
function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cats, setCats] = useState([]);
  const { id } = useParams();
  useEffect(() => {
    const execute = async () => {
      const [categories, productData] = await Promise.all([
        fetchCategories(1, 10),
        fetchProductById(id),
      ]);

      setCats(categories);
      setProduct(productData);
      setIsLoading(false);
    };

    execute();
  }, [id]);
  
  if (isLoading) return (<div>Loading</div>)
  return (
    <div>
      dsakfjsk
    </div>
  )
}

export default ProductDetails
